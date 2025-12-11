
import { generateClient } from "aws-amplify/data";
import type { Schema, Caregiver, LovedOne, SafeZone } from "../../amplify/data/resource";
import { getCurrentUser} from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';
import { ensureAmplifyConfigured } from './amplify-config';

// HARDCODED loved one - all caregivers see this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

let client: ReturnType<typeof generateClient<Schema>> | null = null;

export const getClient = () => {
  if (!client) {
    ensureAmplifyConfigured();
    client = generateClient<Schema>({authMode: 'userPool'});
    console.log("Client generated");
    console.log("Available queries:", client.queries ? Object.keys(client.queries) : "No queries");
  }
  return client;
};

// Force reset client (useful after schema updates)
export const resetClient = () => {
  client = null;
};


export const fetchUserData = async (dispatch: React.Dispatch<any>) => {
    dispatch({ type: 'FETCH_DATA_REQUEST_START' }); // show loading screen
    try {
        const { userId } = await getCurrentUser(); // get current user_id
        console.log('userId: ', userId);
        const { data, errors } = await getClient().models.Caregiver.get({
            id: userId,
        });

        console.log(errors || 'no errors');
        console.log(data || 'no data')

        if(data){
            fetchNotifications(data, dispatch)
        }

    
        if (!errors && data) {
            dispatch({ type: 'SET_CAREGIVER', payload: data }); 
        }
        
        // Always fetch the hardcoded loved one (not from caregiver's loved_one_id)
        const { data: loved_one } = await getClient().models.LovedOne.get({
            id: HARDCODED_LOVED_ONE_ID,
        });
        console.log('Fetched hardcoded loved one:', loved_one);
        
        if(loved_one){
            dispatch({ type: 'SET_LOVEDONE', payload: loved_one }); 
            fetchLastLocation(HARDCODED_LOVED_ONE_ID, dispatch)
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
    dispatch({ type: 'FETCH_DATA_REQUEST_DONE' }); // stop loading screen
};


export const fetchNotifications = async (caregiverUser: Caregiver, dispatch: any) => {
    console.log('fetching notifications for caregiver:', caregiverUser.id)
    try {
        // Use direct query with filter
        const { data: notifications, errors } = await getClient().models.Notification.list({
            filter: { caregiver_id: { eq: caregiverUser.id } }
        });
        
        if (errors) {
            console.error('Error fetching notifications:', errors);
        }
        
        // console.log('Fetched notifications count:', notifications?.length);
        console.log('First notification full object:', JSON.stringify(notifications?.[0], null, 2));
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications || [] });
    } catch (error){
        console.error('Error in fetchNotifications:', error)
    }
};

export const fetchLastLocation = async (loved_one_id: string, dispatch: any) => {
    console.log('fetching location')
    try {
        const { data, errors } = await getClient().queries.FetchLocation({
            user_id: loved_one_id
        });

        if (!errors && data){
            dispatch({ type: 'SET_POSITION', payload: data });
            console.log(data)
        } else {
            console.error(errors)
        }

    } catch (error){
        console.log('error fetching location')
        console.error(error)
    }
};





export const connectCaregiverToLovedOne = async (loved_one_id: string ): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('connectind id ', loved_one_id)
            const { userId } = await getCurrentUser(); // get current user_id
            console.log('connect caregiver to loved_one')
            const {data, errors} = await getClient().models.Caregiver.update({
                id: userId,
                loved_one_id: loved_one_id // replace with an appropriate property
            });
        
            if(errors) {    
                console.error(errors)
                reject(false)
            } else {
                console.log(data)
                resolve(true)
            }
            
        } catch (error){
            console.error(error)
            reject(false)
        }
    })
};


// tmp function to create loved one for testing!
export const createLovedOne = async (lovedOneName?: string, lovedOneEmail?: string, calendarUrl?: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        console.log('create shai - direct DynamoDB creation')
        
        // Use the hardcoded ID so it matches what the app expects
        const loved_one_id = HARDCODED_LOVED_ONE_ID;
        
        // Use provided values or defaults
        const name = lovedOneName || 'Shai';
        const email = lovedOneEmail || 'shai@example.com';
        const calendar_token = calendarUrl || 'none';
        
        console.log('Creating LovedOne with ID:', loved_one_id, 'name:', name, 'email:', email)
        
        try {
            // Create the loved one directly in DynamoDB
            const { data, errors } = await getClient().models.LovedOne.create({
                id: loved_one_id,
                email: email,
                name: name,
                calander_token: calendar_token,
                calander_events: [],
                safe_zones: [],
                known_locations: [],
                default_radius: 500,
                tracker_arn: 'ENTER_YOUR_TRACKER_NAME_HERE',  // Use existing tracker
                geofence_collection_arn: 'placeholder',   // Placeholder for now
            });
            
            console.log('LovedOne created:', data)

            if (errors){
                console.error('Error creating LovedOne:', errors)
                reject(false)
                return
            }
            
            // Connect caregiver to loved one
            await connectCaregiverToLovedOne(loved_one_id)
            console.log('Caregiver connected to LovedOne')
            resolve(true)

        } catch (error){
            console.log('caught a create shai error')
            console.error(error)
            reject(false)
        }
    })
};

export const calendarSync = async (loved_one_id: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        console.log('starting calendarSync')
        try {
          const { userId } = await getCurrentUser(); // get current user_id
          console.log(userId)
          // Your async logic here
          const { data, errors } = await getClient().queries.CalendarSyncFunction({
            user_id: loved_one_id
          });
          if (errors){
            console.error(errors)
            reject(false)
          } else {
            resolve(true)
            console.log(data)
          }
        //   console.log('Async button pressed');
        } catch (error) {
          reject(false)
          console.error('Error:', error);
        }
    })
  };

  export const addCustomLocation = async (
    dispatch: React.Dispatch<any>,
    loved_one_id: string, 
    location_name: string, 
    polygon: { latitude: number; longitude: number }[], 
    current_known_location: SafeZone[]) => {

        return new Promise(async (resolve, reject) => {
            console.log('adding a new custom geofence')
            try {
        
                const newSafeZone : SafeZone = {
                    id: uuidv4(),
                    location_name: location_name,
                    is_custom_location: true,
                    is_home: false,
                    calender_events: [],
                    polygon: polygon
                }
        
                const {data, errors} = await getClient().models.LovedOne.update({
                    id: loved_one_id,
                    known_locations: [...current_known_location, newSafeZone]
                });
        
                console.log(data)
                if (errors){
                    console.log('error creating safezone...')
                    console.log(errors)
                } else {
                    dispatch({ type: 'SET_LOVEDONE', payload: data }); 
                    console.log('add safe zone success!')
                }
                
        
            } catch (error) {
              console.error('Error:', error);
            }
        })


  };

  export const setHome = async (
    dispatch: React.Dispatch<any>,
    loved_one_id: string, 
    polygon: { latitude: number; longitude: number }[],
    location_name?: string): Promise<boolean> => {

        return new Promise(async (resolve, reject) => {

            console.log('setting home')
            console.log(polygon)
            try {
                const newSafeZone : SafeZone = {
                    id: uuidv4(),
                    location_name: location_name || 'Home',
                    is_custom_location: true,
                    is_home: true,
                    calender_events: [],
                    polygon: polygon
                }
        
                const {data, errors} = await getClient().models.LovedOne.update({
                    id: loved_one_id,
                    home: newSafeZone
                });
                // console.log(data)
                if (errors){
                    console.log('error creating home...')
                    console.log(errors)
                    reject(false)
                } else {
                    dispatch({ type: 'SET_LOVEDONE', payload: data }); 
                    console.log('add home success!')
                    resolve(true)
                }
                
        
            } catch (error) {
              console.error('Error:', error);
            reject(false)   
            }
        })


  };


  export const deleteHome = async (dispatch: React.Dispatch<any>, loved_one_id: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      console.log('delete home')
      try {
          const {data, errors} = await getClient().models.LovedOne.update({
              id: loved_one_id,
              home: null
          });
          if (errors){
              console.log('error deleting home...')
              console.log(errors)
              reject(false)
          } else {
              dispatch({ type: 'SET_LOVEDONE', payload: data });
              console.log('delete home success!')
              resolve(true)
          }
      } catch (error) {
        console.error('Error:', error);
        reject(false)
      }
    })
  };

  export const deleteCustomLocation = async (
    dispatch: React.Dispatch<any>,
    loved_one_id: string, 
    safe_zone_id: string,
    current_known_locations: SafeZone[]
  ): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      console.log('deleting custom location', safe_zone_id)
      try {
        // Filter out the location with the matching ID
        const updatedLocations = current_known_locations.filter(
          (location) => location.id !== safe_zone_id
        );
        
        const {data, errors} = await getClient().models.LovedOne.update({
            id: loved_one_id,
            known_locations: updatedLocations
        });
        
        if (errors){
            console.log('error deleting custom location...')
            console.log(errors)
            reject(false)
        } else {
            dispatch({ type: 'SET_LOVEDONE', payload: data });
            console.log('delete custom location success!')
            resolve(true)
        }
      } catch (error) {
        console.error('Error:', error);
        reject(false)
      }
    })
  };