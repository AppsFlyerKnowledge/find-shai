//
//  LocationTracker.swift
//  ShayWatchApp WatchKit Extension
//
//  Created by Jonathan Wesfield on 02/08/2022.
//



import Foundation
import AWSSigner
//import AWSSignerV4
import CoreLocation
import SwiftUI

class LocationTracker: NSObject {
    
    
    var trackerName = "ENTER_YOUR_TRACKER_NAME_HERE"
    var userId = "ENTER_YOUR_DEVICE_ID_HERE"
    
    func getBatteryLevel()->Float{
        let curDevice = WKInterfaceDevice.current()
        curDevice.isBatteryMonitoringEnabled = true // Enable just long enough for data
        let chargeLevel = curDevice.batteryLevel
        curDevice.isBatteryMonitoringEnabled = false
        
        
        return chargeLevel
    }
    
    func updateJSON(locations: [CLLocation]){
        print("got locations to update \(locations.count)")
        
        for location in locations {
            
            let json: [String: Any] =
            [
                "Updates":
                    [[
                        "Accuracy":
                            [
//                                "Horizontal": location.horizontalAccuracy // TODO check and send 5m updates
                                
                                "Horizontal": location.horizontalAccuracy // TODO check and send 5m updates

                            ],
                        "Position":
                            [
                                location.coordinate.longitude,
                                location.coordinate.latitude
                            ],
                        "PositionProperties":
                            [
                                "battery" : getBatteryLevel()
                            ],
                        "SampleTime": iso8601(),
                        "DeviceId": userId,
                    ]]
            ]
//             print(json)
            let jsonData = try? JSONSerialization.data(withJSONObject: json)
            if let data = jsonData {
                // write update time
        
                if shouldUpdate() {
             
                    updateTracker(body: data)
                } else {
//                    print("skipping update becasue 10 seconds did not pass")
                }
          
                
            }
             print(String(decoding: jsonData!, as: UTF8.self))
            
        }
    }
    
    func updateTracker(body: Data){
        print("update tracker called")
        UserDefaults.standard.set(Date(), forKey: "last_update_time")

        // Replace with your AWS region
        let url = URL(string: "https://tracking.geo.ENTER_YOUR_AWS_REGION_HERE.amazonaws.com/tracking/v0/trackers/\(trackerName)/positions")!
        // Replace with your AWS credentials from IAM
        let credentials = StaticCredential(accessKeyId: "ENTER_YOUR_ACCESS_KEY_ID_HERE", secretAccessKey: "ENTER_YOUR_SECRET_ACCESS_KEY_HERE")
        let signer = AWSSigner(credentials: credentials, name: "geo", region: "ENTER_YOUR_AWS_REGION_HERE")
        let signedHeaders = signer.signHeaders(
            url: url,
            method: .POST,
            body: .data(body))
        
        let headers = signedHeaders.makeIterator()
        var request = URLRequest(url: url)
        request.httpBody = body
        request.httpMethod = "POST"
        for header in headers {
            request.setValue(header.value, forHTTPHeaderField: header.name)
        }
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            
            if let httpResponse = response as? HTTPURLResponse {
                print(" status code: \(httpResponse.statusCode)")
            }
            
            if let data = data {
                
                print(String(decoding: data, as: UTF8.self))
                
            } else if let error = error {
                print("HTTP Request Failed \(error)")
            }
        }
        
        task.resume()
        
        
    }
    
    func shouldUpdate() -> Bool{
        
        if let last_update = UserDefaults.standard.object(forKey: "last_update_time") as? Date {
//            print("got last date")
//            print(last_update)
            
            let start = Date()
            let timeToLive: TimeInterval = 30
            let isExpired = start.timeIntervalSince(last_update) >= timeToLive
            
            if isExpired {
//                print("jonny is expired last: \(last_update) start: \(start)")
                return true
            } else {
//                print("jonny not expired last: \(last_update) start: \(start)")
                return false
            }
            
        }
        
        return true
    }
    
    //2022-08-07T08:23:27Z
    
    private let iso8601Formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssXXXXX"
        return formatter
    }()
    
    private func iso8601() -> String {
        let date = iso8601Formatter.string(from: Date())
        return date
    }
}

