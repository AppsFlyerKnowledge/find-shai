//
//  LocationManager.swift
//  ShayWatchApp WatchKit Extension
//
//  Created by Jonathan Wesfield on 02/08/2022.
//

import Foundation
import CoreLocation

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    
    let manager = CLLocationManager()
    let updater = LocationTracker()
    
    
    override init(){
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest 
        manager.requestAlwaysAuthorization()
        manager.startUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = true
//        manager.distanceFilter = 20 // meters
        manager.distanceFilter = kCLDistanceFilterNone
        print("init location manager")
    
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        print("didUpdateLocations")
        updater.updateJSON(locations: locations)
    }
     
    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        print("didUpdateHeading")
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
        print("didFailWithError")
        print(error.localizedDescription)
        
        // Print the error for debugging purposes
          print("Location Manager failed with error: \(error.localizedDescription)")
          
          // Handle specific error cases
          if let clError = error as? CLError {
              switch clError.code {
              case .denied:
                  print("Location services denied.")
              case .network:
                  print("Network error.")
              case .locationUnknown:
                  print("Location unknown.")
              default:
                  print("Other location error.")
              }
          }

    }
    
    func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        print("locationManagerShouldDisplayHeadingCalibration")
        return true
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        print("didChangeAuthorization")
    }
    
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedAlways:
            print("authorizedAlways")
        case .authorizedWhenInUse:
            print("authorizedWhenInUse")
        case .notDetermined:
            print("notDetermined")
        case .denied:
            print("denied")
        case .restricted:
            print("restricted")
        @unknown default:
            print("default")
        }
    }
}


