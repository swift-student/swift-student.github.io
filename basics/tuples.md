---
layout: page
title: Tuples
---

# Tuples

Tuples could be thought of as a lightweight alternative to a struct. Unlike structs though, tuples can't perform functions or conform to protocols, they simply act as a container for elements of any type. A tuple describing me might look like the following:

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

The type alias does just what it's name implies. It creates an alieas for my type, which happens to be a tuple with the format `(name: String, age: Int, favoriteColor: String)` and stores it in the alias `Person`. I can then use `Person` anywhere I would have used `(name: String, age: Int, favoriteColor: String)`.