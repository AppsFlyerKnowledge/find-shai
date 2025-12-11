import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import {LovedOne, Caregiver, CalendarEvent, SafeZone, Notification, Position } from '../../amplify/data/resource';

// Define the shape of the state
interface State {
    error: null,
    loading: boolean;
    lovedOne: LovedOne | null;
    userProfile: Caregiver | null;
    safeZones: SafeZone[]
    calendarEvents: CalendarEvent[]
    notifications: Notification[],
    position: Position | null
}

// Define the actions
type Action = 
| { type: 'FETCH_DATA_REQUEST_START' }
| { type: 'FETCH_DATA_REQUEST_DONE' } 
| { type: 'SET_CAREGIVER', payload: Caregiver  } 
| { type: 'SET_LOVEDONE', payload: LovedOne }
| { type: 'SET_NOTIFICATIONS', payload: Notification[] } 
| { type: 'SET_POSITION', payload: Position } ;

// Create the initial state
const initialState: State = {
    error: null,
    loading: false,
    lovedOne: null,
    userProfile: null,
    position: null,
    safeZones: [],
    calendarEvents: [],
    notifications: []
};

// Create the reducer function
const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'FETCH_DATA_REQUEST_START':
            return { ...state, loading: true };
        case 'FETCH_DATA_REQUEST_DONE':
                return { ...state, loading: false };
        case 'SET_CAREGIVER':
            return { ...state, userProfile: action.payload };
        case 'SET_LOVEDONE':
            return { ...state, lovedOne: action.payload };
        case 'SET_NOTIFICATIONS':
            return { ...state, notifications: action.payload };
        case 'SET_POSITION':
                return { ...state, position: action.payload };
        default:
            return state;
    }
};

// Create the context
const StateContext = createContext<{ state: State; dispatch: Dispatch<Action> } | undefined>(undefined);


// Create a provider component
const StateProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <StateContext.Provider value={{ state, dispatch }}>
            {children}
        </StateContext.Provider>
    );
};

// Create a custom hook to use the state
const useStateContext = () => {
    const context = useContext(StateContext);
    if (context === undefined) {
        throw new Error('useStateContext must be used within a StateProvider');
    }
    return context;
};

export { StateProvider, useStateContext };