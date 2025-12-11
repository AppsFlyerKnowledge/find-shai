import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Agenda } from "react-native-calendars";
import { useStateContext } from "@/state/state";

const AgendaInfiniteListScreen = () => {
  const { state } = useStateContext();
  const today = new Date().toISOString().split("T")[0];
  const [items, setItems] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const formattedEvents: { [key: string]: any[] } = {};
    state.lovedOne?.calander_events.forEach((event) => {
      if (event) {
        const dateKey = event.start_time.split("T")[0]; // Use the start_time to get the date key
        if (!formattedEvents[dateKey]) {
          formattedEvents[dateKey] = [];
        }
        formattedEvents[dateKey].push({
          id: event.id,
          name: event.event_name,
          start_time: event.start_time,
          end_time: event.end_time,
          location_name: event.location_name,
          // any other event details you want to include
        });
      }
    });
    setItems(formattedEvents);
  }, [state.lovedOne?.calander_events]); // Update when calendar events change

  const calTest = state.lovedOne?.calander_events.map((event) => {
    return {
      [today]: [
        {
          name: event?.event_name,
          height: 50,
        },
      ],
    };
  });

  const loadItems = (day: any) => {
    const newItems: { [key: string]: any[] } = {};
    for (let i = -2; i < 2; i++) {
      const time = day.timestamp + i * 24 * 60 * 60 * 1000;
      const strTime = timeToString(time);
      if (!newItems[strTime]) {
        newItems[strTime] = [];
        const numItems = Math.floor(Math.random() * 3 + 1);
        for (let j = 0; j < numItems; j++) {
          newItems[strTime].push({
            name: `Item for ${strTime} #${j}`,
            height: Math.max(50, Math.floor(Math.random() * 150)),
          });
        }
      }
    }

    console.log(newItems);

    setItems(newItems);
  };

  const timeToString = (time: number) => {
    const date = new Date(time);
    return date.toISOString().split("T")[0];
  };

  const renderItem = (item: any) => {
    return (
      <View style={styles.item}>
        <Text>{item.name}</Text>
        <Text>{`Start: ${new Date(
          item.start_time
        ).toLocaleTimeString()}`}</Text>
        <Text>{`End: ${new Date(item.end_time).toLocaleTimeString()}`}</Text>
        <Text>{item.location_name}</Text>
      </View>
    );
  };

  return (
    <Agenda
      items={items}
      //   loadItemsForMonth={loadItems}
      selected={today}
      renderItem={renderItem}
    />
  );
};

export default AgendaInfiniteListScreen;

const styles = StyleSheet.create({
  item: {
    backgroundColor: "white",
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
});
