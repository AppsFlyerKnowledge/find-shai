//
//  ShayWatchAppApp.swift
//  ShayWatchApp WatchKit Extension
//
//  Created by Jonathan Wesfield on 02/08/2022.
//

import SwiftUI

@main
struct ShayWatchAppApp: App {
    
    @StateObject var lm = LocationManager()
    @WKApplicationDelegateAdaptor(ExtensionDelegate.self) var extensionDelegate
    
    @SceneBuilder var body: some Scene {
        WindowGroup {
            NavigationView {
                ContentView()
            }
        }

        WKNotificationScene(controller: NotificationController.self, category: "myCategory")
    }
}
