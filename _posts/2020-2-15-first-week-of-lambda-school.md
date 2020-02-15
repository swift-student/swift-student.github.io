---
layout: post
title: First Week of Lambda School
subtitle:
tags:
comments: true

typora-root-url: ../../swift-student.github.io

---

I have officially completed my first week with Lambda School, and at this point I am super excited for my career as an iOS developer. Being able to dedicate over 40 hours a week to learning, combined with the collaborative environment of Lambda will really accelerate my progress. I feel like in 9 months I will be more than ready to take on a developer position.

Although most of the material this week was review for me I still managed to learn quite a bit by pushing myself to go further than what was assigned. You can only get out of something what you put into it, so rather than coast on through and lavish in the free time, I made every effort to extend my knowledge. 

Beyond that, I tried to participate as much as possible in the discussion in class, where I am admittedly uncomfortable at this point. My soft skills are one of the things that need the most improvement, and the decision to join Lambda was heavily swayed by this fact.

------



# Tuples & Type Alias

I hadn't really had the opportunity to work with tuples much before this week. Tuples could be thought of as a lightweight alternative to a struct. Unlike structs though, tuples can't perform functions or conform to protocols, they simply act as a container for elements of any type. A tuple describing me might look like the following:

```swift
let shawn = (name: "Shawn Gee", age: "31", favoriteColor: "blue")
```

This could also be declared without naming the elements.

```swift
let shawn = ("Shawn Gee", "31", "blue")
```

However, later when accessing the elements of a tuple, it may be much more convenient to retrieve them by name such as `shawn.name` instead of retrieving them by position as in `shawn.0`

Let's say that I want to make a function that takes in an array of people tuples and prints out their name, age, and favorite color. I could declare the function like this:

```swift
func printDescriptions(ofPeople people: [(name: String, age: Int, favoriteColor: String)])
```

However, this is a case where a type alias would come in super handy. Using one I can write the following to improve the readability of my code significantly:

```swift
typealias Person = (name: String, age: Int, favoriteColor: String)

func printDescriptions(ofPeople people:[Person])
```

------



# Combine

I got a chance last Friday to sit in on what Lambda calls a brown bag, which basically means a guest lecture at lunch time, though I'm not sure they are always held at lunch time. During this session, guest speaker Scott Gardner introduced me to Combine, Apple's new reactive programming framework. I had some prior exposure with SwiftUI, and I must say that I really love the functional way of doing things. It seems very logical, and avoids unnecessary state. 

Using the code we wrote in the playground during his brown bag as a starting point, I made a call to an API to fetch currency exchange rates in my Currency Swap app this week:

```swift
var subscriptions = Set<AnyCancellable>()
    
func fetchLatestRates() {
    URLSession.shared.dataTaskPublisher(for: K.apiURL)
        .retry(1)
        .map(\.data)
        .decode(type: LatestRatesResult.self, decoder: JSONDecoder())
        .sink(receiveCompletion: { completion in
            print(completion)
        }, receiveValue: { value in
            self.latestRatesResult = value
        })
        .store(in: &subscriptions)
}
```

I won't go over exactly how this code works, as it's more than can be quickly summarized, but if you have fetched from an API the traditional way before, you know how much more effort that takes. Also, don't beat me up for not properly handling the case that the data couldn't be retrieved, I only had so much time to work on this project.

This project also gave me the chance to collaborate with my wife, who decided to try her hand at UI design. Here is what we came up with:

![ScreenShot](/img/2020-2-15-first-week-of-lambda-school/ScreenShot.png)

------



# Filter & Map Performance

Speaking of doing things in a functional, or what some might refer to as a "Swifty" way, I tried to incorporate Swift's built in higher order functions during the course work. I made use of filter & map in my sprint challenge yesterday to retrieve a list of the names of ice cream flavors with a rating over 4.0:

```swift
let topFlavorNames = flavors.filter { $0.rating > 4.0 }.map { $0.name.lowercased() }
```

My TL noted that playgrounds was indicating that this line was running more times than a simple for loop, and wondered if it might be less efficient than a for loop, especially with large data sets. This piqued my curiosity, so I set out to figure out how to actually test to see which one was more performant. This search led me to the XCTestCase class.

I subclassed XCTestCase and created two sample functions that operated on an array of flavors, one using filter and map, and the other a for loop. Within those functions I nested my code in a measure block to test the performance of each function. Then I just run the test suite at the bottom. Here is what my playground looked like:

```swift
import Foundation
import XCTest

struct Flavor {
    let name: String
    var rating: Double
}

class FilterMapVsForLoop: XCTestCase {
    var flavors = [Flavor(name: "Chocolate", rating: 4.7), 
                   Flavor(name: "Vanilla", rating: 4.3), 
                   Flavor(name: "Neopolitan", rating: 3.5),
                   // Imagine many more flavors here
                  ]

    func testFilterMapPerformance() {
        measure {
            let topFlavorNames = flavors.filter { $0.rating > 4.0 }.map { $0.name.lowercased() }
        }
    }
    
    func testForLoopPerformance() {
        measure {
            var topFlavorNames = [String]()
            for flavor in flavors {
                if flavor.rating > 4.0 {
                    topFlavorNames.append(flavor.name.lowercased())
                }
            }
        }
    }
}

FilterMapVsForLoop.defaultTestSuite.run()
```

Running this test with just a few flavors actually does indeed result in the for loop beating the filter and map combo. However, when the sample size is increased to just 100 flavors, filter and map consistently beat out the for loop, coming in at less than half the average run time. Doing the same test with just filtering out flavors and not mapping the name, filter was over 10 times faster than the for loop. Long story short, no need to worry about performance using filter, map, reduce and such instead of for loops in my code.

------



# Wrap Up

Overall, I feel really good about my first week at Lambda. I learned so much more than I could cover in one blog post. Besides what I covered, I gained experience with:

- NumberFormatter
- DateForamatter
- Programatic UIStackViews and Auto Layout
- Caseless enums as namespace for constants
- Recreating a design from a Figma mockup
- Solving a coding challenge in 45 minutes (time limits stress me, lol)
- Interacting with staff and students using Slack and Zoom
- Git - How could I forget this? I had used git, but Lambda will exponentially improve my git skills
- Workflow tips, shortcuts, and so much more!

If you are considering joining Lambda, based on my first week's experience, I highly recommend it! You will learn so much in a structured course like this. I'm looking forward to the next 9 months of my journey.

