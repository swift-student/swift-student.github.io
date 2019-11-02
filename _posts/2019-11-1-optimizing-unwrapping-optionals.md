---
layout: post
title: Optimizing Optional Unwrapping
subtitle: Quick Tips
tags: [test]
comments: true
---

While I picked up the concept of optionals in Swift fairly quickly, it took me a while to realize a few things about unwrapping them that made life a bit easier. I'm not going to go in to depth about [what an optional is](https://developer.apple.com/documentation/swift/optional), or the different ways of unwrapping them as there are excellent articles out there such as [this one from Hacking With Swift](https://www.hackingwithswift.com/sixty/10/2/unwrapping-optionals). 

The most common way I've found myself unwrapping optionals is optional binding using if let statements. In the beginning I was presented with, and subsequently wrote code that often times looked like the following:

``` swift
var name: String?
var age: Int?

name = "Shawn"
age = 30

func printIntroduction() {
    if let unwrappedName = name {
        if let unwrappedAge = age {
            print("Hi, my name is \(unwrappedName) and I am \(unwrappedAge) years old.")
        }
    }
}
```

This works fine, however I found a couple issues with this method as I went along. First if you have many optionals to unwrap before doing a task, your coded can become deeply nested, which can be a bit hard on the eyes to follow sometimes. Now, it may seem obvious to those of you who know, but I didn't realize for a long time that you could unwrap multiple optionals by simply linking them with a comma like this:

``` swift
func printIntroduction() {
    if let unwrappedName = name, let unwrappedAge = age {
            print("Hi, my name is \(unwrappedName) and I am \(unwrappedAge) years old.")
    }
}
```

Next up, I struggled for a long time deciding what to name my unwrapped optionals. In some circumstances, such as when optional chaining, or when you get an optional back from a function, it can be easy to just use a simple name that makes sense. However, in cases like the above, where the obvious name is already taken, it can be a challenge. Then one day I noticed that someone simply assigned the same name to an unwrapped optional, something that I hadn't considered before. So that simplifies our function yet again:

``` swift
func printIntroduction() {
    if let name = name, let age = age {
            print("Hi, my name is \(name) and I am \(age) years old.")
    }
}
```
Finally, I have come to prefer to use guard let in instances like this, where if an optional is nil, it doesn't make any sense to continue in the function. We can't print out an introduction like this without a name and age, right? This has the added benefit of further reducing nesting, which happens to make me happy.

``` swift
func printIntroduction() {
    guard let name = name, let age = age else { return }
    print("Hi, my name is \(name) and I am \(age) years old.")
}
```
I understand much of this may come down to personal preference and coding style, but I just wanted to share a few things I didn't realize at first that have helped me simplify unwrapping optionals in my code.

