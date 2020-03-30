---
layout: post
title: NSBatchInsertRequest
subtitle:
tags:
comments: true
typora-root-url: ../../swift-student.github.io

---

As part of our week long delve into Core Data at Lambda School, we practiced syncing APIs with Core Data by fetching the data from the server and using Codable to produce representations which we then used to either update or insert objects into Core Data. This technique works great, however it involves loading objects into memory, which is not necessarily a problem when dealing with a small data set, but can become an issue when dealing with larger data sets. 

There are a couple of ways to deal with this issue, including batching as demonstrated by [Apple's example code here](https://developer.apple.com/documentation/coredata/loading_and_displaying_a_large_data_feed), or using a third party library such as [FastEasyMapping](https://github.com/Yalantis/FastEasyMapping). However, with iOS13, Apple introduced NSBatchInsertRequest, which operates at the SQL level and doesn't load objects into memory, and is faster than other methods. It does come with some caveats though: 

- It doesn't update or insert relationships

- It doesn't apply any Core Data validation rules

- You must manually update your context to reflect changes

- JSON keys must exactly match your Core Data entities

  

  ------



With all of those limitations in mind, let's jump in to an example of how to use this new feature. To start with, I am again using Swift 5 and targeting iOS13. I have set up a simple Firebase realtime database to sync a simple movie watch list app with. 

If you are fetching objects from your API that may or may not have counterparts in Core Data, you need to have some way to make sure that you don't create duplicate entries. Thankfully, Core Data has a solution, in the form of Core Data Constraints. Constraints allow you to define one or more attributes that must be unique for each entity in your model. In my case I added the identifier attribute in the model editor. 

![ScreenShotModelEditor](/img/2020-3-29/ScreenShotModelEditor.png)

Keep in mind that this solution works equally well whether you are using NSBatchInsertRequest or just using Codable, but there is one step later on that you will need to pay attention to when using this method.

When fetching data in my FirebaseClient, instead of using a JSON decoder to decode a movie representation, I use JSON serialization to convert the data from Firebase to a dictionary of type `[String: MovieDict]`. Note that I used a typealias for clarity, and MovieDicts are themselves dictionaries of type `[String: Any]`.

```swift
// Inside URLSession.shared.dataTask's completion closure
do {
    guard let movieDictsByID = try JSONSerialization.jsonObject(with: data) as? [String: MovieDict] else {
        throw NSError(domain: "Unable to cast JSON object to [String: MovieDict]", code: 2)
    }
    let movieDicts: [MovieDict] = Array(movieDictsByID.values)
    completion(.success(movieDicts))
} catch {
    NSLog("Couldn't decode movie dictionaries \(error)")
    completion(.failure(error))
}
```

Since Firebase gives me back a dictionary as the top level object, I have to grab the just values from that dictionary before passing back an array of movie dictionaries. Then in my MovieController where I do the syncing, I pass this array into a function to do the syncing:

```swift
1 private func syncMovies(with movieDicts: [MovieDict]) {
2     let bgContext = CoreDataStack.shared.container.newBackgroundContext()
3     bgContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
4     let mainContext = CoreDataStack.shared.mainContext
5     
6     bgContext.performAndWait {
7         let insertRequest = NSBatchInsertRequest(entity: Movie.entity(), objects: movieDicts)
8         insertRequest.resultType = NSBatchInsertRequestResultType.objectIDs
9         let result = try? bgContext.execute(insertRequest) as? NSBatchInsertResult
10        
11        if let objectIDs = result?.result as? [NSManagedObjectID], !objectIDs.isEmpty {
12            let save = [NSInsertedObjectsKey: objectIDs]
13            NSManagedObjectContext.mergeChanges(fromRemoteContextSave: save, into: [mainContext])
14        }
15    }
16}
```

Let's break this code down to see what is happening:

**Line 2:** Since this function is running on the background queue from URLSession, I need to make sure I do my work on a background managed object context.

**Line 3:** Remember when I said there was an important step to be aware of when using Core Data Constraints? If you don't set the merge policy on the context in which you are doing your updates, the default is `NSErrorMergePolicy` which means if there is a conflict, you get back a dictionary that tells you all of the objects that couldn't be merged. This leaves your existing entities alone, and only inserts new ones that are unique. While this may be useful in some circumstances, by setting the merge policy to `NSMergeByPropertyObjectTrumpMergePolicy`, we are letting Core Data know that it should overwrite the existing data. This strategy assumes that the data on the server is always correct.

**Line 6:** Since we are on a background queue, we can safely use `performAndWait` without blocking the main queue. In this case, I am choosing to use `performAndWait` over using `perform`, as I will be calling my table view controller on completion to let it know that the syncing is complete.

**Line 7:** We now create an `NSBatchInsertRequest`, passing in the type of entity we are inserting, and an array of objects, which have to be of type `[String: Any]`. Each of these dictionaries correspond to an entity's attributes, which are the keys, and their values. Be sure that the String keys are exactly the same as the ones in Core Data. However, if a key is missing, you can use default values in Core Data to fill a value for that attribute.

**Line 8:** We need to set the result type of the request before executing it, in order to be able to pass the changes to our managed object context.

**Line 9:** We then try to execute the batch insert, and try to cast the result to a `NSBatchInsertResult`.

**Line 13:** If the result contains any object IDs we then merge those changes back into the main context. Note that if you are using a fetched results controller, as I was in this app, you will need re-fetch and reload your table view, as the fetched results controller won't be aware of the changes made to your model.



------



I hope this quick example gives you an idea of how to implement NSBatchInsertRequest. I am new to Core Data, and by no means an expert, but I didn't see much info on how to get this new feature set up, so I thought I would share what worked for me. As always, feel free to reach out to me with any comments or questions!

