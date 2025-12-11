//
//  Main_ExtensionDelegate.swift
//  ShayWatchApp WatchKit Extension
//
//  Created by Jonathan Wesfield on 18/09/2022.
//

import Foundation
import WatchKit

class ExtensionDelegate: NSObject, WKApplicationDelegate{
    
//    func didReceiveRemoteNotification(_ userInfo: [AnyHashable : Any]) async -> WKBackgroundFetchResult {
//        print("didReceiveRemoteNotification")
//        return WKBackgroundFetchResult()
//    }
    
    func didRegisterForRemoteNotifications(withDeviceToken deviceToken: Data) {
        print("didRegisterForRemoteNotifications")
        print(deviceToken)
    }
    
    func didFailToRegisterForRemoteNotificationsWithError(_ error: Error) {
        print("didFailToRegisterForRemoteNotificationsWithError")

    }
    
    func applicationDidBecomeActive() {
        print("applicationDidBecomeActive")
    }
    
    func applicationDidFinishLaunching() {
        WKApplication.shared().registerForRemoteNotifications()
        print(iso8601())
    }
    
    
    // YYYY-MM-DDThh:mm:ss.sssZ
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
