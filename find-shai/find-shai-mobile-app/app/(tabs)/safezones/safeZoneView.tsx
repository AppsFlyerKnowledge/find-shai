import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Alert,
} from "react-native";

import { SwipeListView } from "react-native-swipe-list-view";
import { useStateContext } from "@/state/state";
import { SafeZone } from "../../../../amplify/data/resource";
import { router } from "expo-router";
import { deleteHome, deleteCustomLocation } from "../../../api/data";

// HARDCODED loved one - all caregivers see this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

export default function SectionList() {
  const { state, dispatch } = useStateContext();

  const data: Section[] = [
    {
      title: "Active",
      data: (state.lovedOne?.safe_zones || []).filter((zone): zone is SafeZone => zone !== null && zone !== undefined),
    },
    {
      title: "Custom",
      data: (state.lovedOne?.known_locations || []).filter((location): location is SafeZone => location !== null && location !== undefined),
      onAdd: () =>
        router.push({
          pathname: "/safezones/SafeZoneCreation",
          params: { type: "add_custom" },
        }),
      // onEdit: () => router.navigate('/safezones/modal'),
    },
    {
      title: "Home",
      data: state.lovedOne?.home ? [state.lovedOne.home] : [],
      onAdd: () =>
        router.push({
          pathname: "/safezones/SafeZoneCreation",
          params: { type: "add_home" },
        }),
      // onDelete: () => console.log('Delete'),
      // onEdit: () => console.log('Edit'),
    },
  ];

  interface Section {
    title: string;
    data: SafeZone[];
    onAdd?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
  }

  interface RenderItemData {
    item: SafeZone;
    section: Section;
    separators?: any;
  }

  const closeRow = (rowMap: any, rowKey: string) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const deleteRow = async (rowMap: any, rowKey: string, item: SafeZone, sectionTitle: string) => {
    if (!state.lovedOne?.id) {
      Alert.alert("Error", "No loved one found");
      return;
    }

    Alert.alert(
      "Delete Safe Zone",
      `Are you sure you want to delete "${item.location_name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              closeRow(rowMap, rowKey);
              
              if (sectionTitle === "Home") {
                await deleteHome(dispatch, HARDCODED_LOVED_ONE_ID);
                Alert.alert("Success", "Home deleted successfully");
              } else if (sectionTitle === "Custom") {
                const currentLocations = state.lovedOne?.known_locations?.filter(
                  (loc): loc is SafeZone => loc !== null && loc !== undefined
                ) || [];
                await deleteCustomLocation(dispatch, HARDCODED_LOVED_ONE_ID, item.id, currentLocations);
                Alert.alert("Success", "Safe zone deleted successfully");
              }
            } catch (error) {
              console.error("Error deleting:", error);
              Alert.alert("Error", "Failed to delete. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderItem = (data: any) => (
    <TouchableHighlight
      onPress={() => {
        console.log(data);
        router.push({
          pathname: "/safezones/safezone",
          params: { safeZoneId: data.item.id, section: data.section.title },
        });
      }}
      style={styles.rowFront}
      underlayColor={"#AAA"}
    >
      <View>
        <Text>{data.item.location_name}</Text>
      </View>
    </TouchableHighlight>
  );

  const renderHiddenItem = (data: any, rowMap: any) => {
    if (data.section.title === "Active") {
      return null;
    }

    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteRow(rowMap, data.item.id, data.item, data.section.title)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderheaderButton = (title: string, action?: () => void) => {
    if (action === undefined) {
      return null;
    }
    return (
      <TouchableOpacity style={styles.button} onPress={action}>
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const SectionHeader = ({ section }: { section: Section }) => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{section.title}</Text>

        <View style={styles.buttonContainer}>
          {renderheaderButton("Add", section.onAdd)}
          {renderheaderButton("Edit", section.onEdit)}
          {renderheaderButton("Delete", section.onDelete)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SwipeListView
        useSectionList
        sections={data as any}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        renderSectionHeader={({ section }: any) => (
          <SectionHeader section={section} />
        )}
        leftOpenValue={0}
        rightOpenValue={-80}
        previewRowKey={"0"}
        previewOpenValue={-40}
        previewOpenDelay={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  backTextWhite: {
    color: "#FFF",
  },
  rowFront: {
    alignItems: "center",
    backgroundColor: "#CCC",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    justifyContent: "center",
    height: 50,
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#CCC",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 0,
  },
  deleteBtn: {
    alignItems: "center",
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    width: 80,
    height: 50,
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  deleteText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerContainer: {
    backgroundColor: "#f4f4f4",
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 14,
    color: "#000",
  },
  itemContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  item: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 4,
    elevation: 1, // Add elevation for shadow on Android (optional)
    shadowColor: "#000", // Below lines for iOS shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
