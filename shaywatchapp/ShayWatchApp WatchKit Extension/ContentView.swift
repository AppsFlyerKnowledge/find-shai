//
//  ContentView.swift
//  ShayWatchApp WatchKit Extension
//
//  Created by Jonathan Wesfield on 02/08/2022.
//

import SwiftUI

func getDate()->String{
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .hebrew)
    formatter.locale = Locale(identifier: "he")
    formatter.dateStyle = .short
    formatter.setLocalizedDateFormatFromTemplate("dd MMMM yyyy")
    return formatter.string(from: Date())
}

struct ContentView: View {
    var body: some View {
        Text(getDate())
            .padding()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
