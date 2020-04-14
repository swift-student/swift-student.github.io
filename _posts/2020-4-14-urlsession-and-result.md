---

layout: post
title: URLSession & Result
subtitle:
tags:
comments: true
typora-root-url: ../../swift-student.github.io


---

Recently, I was reading a [Paul Hudson article on the Swift Result type](https://www.hackingwithswift.com/articles/161/how-to-use-result-in-swift), which was introduced in Swift 5.0. In this article, he mentioned that Apple hadn't yet adopted Result into their own frameworks. This lead me to think, why not write an extension on URLSession to make a data task return `Result<Data, Error>` instead of `Data?, URLResponse?, Error?`.  So that's what I set about to do this past weekend.

## Error Handling

Instead of returning a plain Error, I chose to create a NetworkError enum. This enum simply conforms to the Error protocol and allows us to define what type of error was encountered when attempting a network request. You can add cases to it as needed, but here is the one I will use for this example:

```swift
enum NetworkError: Error {
    case transportError(Error)
    case serverError(statusCode: Int)
    case noData
    case decodingError(Error)
    case encodingError(Error)
}
```

URLSession draws a line between the two error types that can be returned. Those that have to do with the transport, or going to and from the server, are passed in the `Error?` parameter of the completion handler. Server-side errors, on the other hand, are indicated by the HTTP status code of the response. These are specific to each server, but for the sake of this example, I will be treating any status code not in the range of 200...299 as an error (you could make the range of expected codes a variable if you like). Using `NetworkError` we can indicate which of these errors was encountered, and pass along the associated error or status code in the associated value of the enum.

Let's first take a look at an example of a data task using the standard completion handler:

```swift
func getAlbums(completion: @escaping (Result<[Album], NetworkError>) -> Void) {
    let request = URLRequest(url: baseURL.appendingPathExtension("json"))
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(.transportError(error)))
            return
        }
        
        if let response = response as? HTTPURLResponse, !(200...299).contains(response.statusCode) {
            completion(.failure(.serverError(statusCode: response.statusCode)))
            return
        }
        
        guard let data = data else {
            completion(.failure(.noData))
            return
        }
        
        do {
            let albums = try Array(JSONDecoder().decode([String: Album].self, from: data!).values)
            completion(.success(albums))
        } catch {
            completion(.failure(.decodingError(error)))
        }
    }.resume()
}
```

While there is nothing inherently wrong with this code, as I start writing more network calls, a pattern emerges where I begin to repeat myself. I check the error, then I check the response, then I check to make sure there is data, and finally I do something with the data. I check the error, check the response, check the data, do something. Check error, check response, check data... I think you get the point.

Before we get to extending data task to return a Result, why don't we try to extract this checking for an error case out to somewhere else so we don't have to keep writing it every time? I think a reasonable approach would be to make a failable initializer for a NetworkError. This way we can try to initialize a NetworkError with the data, response, and error passed in to the completion handler, and if there is no NetworkError returned, we can go ahead and work with our data.

```swift
extension NetworkError {
    
    init?(data: Data?, response: URLResponse?, error: Error?) {
        if let error = error {
            self = .transportError(error)
            return
        }

        if let response = response as? HTTPURLResponse,
            !(200...299).contains(response.statusCode) {
            self = .serverError(statusCode: response.statusCode)
            return
        }
        
        if data == nil {
            self = .noData
        }
        
        return nil
    }
}
```



This alone greatly simplifies our code and allows us to check for an error just once with each data task:

```swift
func getAlbums(completion: @escaping (Result<[Album], NetworkError>) -> Void) {
    let request = URLRequest(url: baseURL.appendingPathExtension("json"))
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let networkError = NetworkError(data: data, response: response, error: error) {
            completion(.failure(networkError))
        }
        
        do {
            let albums = try Array(JSONDecoder().decode([String: Album].self, from: data!).values)
            completion(.success(albums))
        } catch {
            completion(.failure(.decodingError(error)))
        }
    }.resume()
}
```



------

## Extending URLSession

Now let's see about extending URLSession to return a `Result<Data, NetworkError>`.  I'll first typealias this result to DataResult to make it more convenient to type. Then I create a function with almost the same function signature as the default dataTask, but with a result handler (named resultHandler instead of completionHandler to avoid ambiguity) that passes in a DataResult instead of the usual data, response, and error optionals.

```swift
typealias DataResult = Result<Data, NetworkError>

extension URLSession {
  
    func dataTask(with request: URLRequest, resultHandler: @escaping (DataResult) -> Void) -> URLSessionDataTask {
        
        return self.dataTask(with: request) { data, response, error in
            
                if let networkError = NetworkError(data: data, response: response, error: error) {
                    completionHandler(.failure(networkError))
                    return
                }
                
                completionHandler(.success(data!))
        }
    }
}
```



------

## Decoding

Now we can use this new data task method in our network client. However, before we do, I want to simplify the decoding of the result that I get back. I will need something that can take the `Result<Data, NetworkError>` and convert it to a `Result<T, NetworkError>`, where `T` is the type of model that we want to return. 

This process isn't always a one step JSONDecoder thing though, so it's not that easy to generalize with generics. As you can see in the example code above, my `getAlbums` method passes an array of `Album` to the completion closure, but first I need to decode  a dictionary of `[String: Album]` and then grab only the values from that dictionary. There are many times when decoding JSON where you must "peel back the onion skin" to get the values you are really interested in.

To solve this issue, I ended up defining a struct called `ResultDecoder`. This struct has one method that uses a throwing block passed in on initialization to transform the result into the desired type. Some of this code may seem foreign on first glance, but I will do my best to explain what is going on. 

```swift
struct ResultDecoder<T> { 
    
    private let transform: (Data) throws -> T
    
    init (_ transform: @escaping (Data) throws -> T) {
        self.transform = tranform
    }
    
    func decode(_ result: DataResult) -> Result<T, NetworkError> {
        result.flatMap { (data) -> Result<T, NetworkError> in // 1
            Result { try transform(data) } // 2
                .mapError { NetworkError.decodingError($0) } // 3
        }
    }
}
```

Firstly, I realized from reading [Paul's aforementioned article](https://www.hackingwithswift.com/articles/161/how-to-use-result-in-swift) that the Result type has handy methods to map and flatMap both the success value and error value using a transform closure. Result also has an initializer that takes a throwing closure. I use these features in unison to map the data passed in and initialize a Result using the transform block, which creates a `Result<T, Error>`. I then map the error to a `NetworkError.decodingError`, giving us a `Result<T, NetworkError>`. 

So to reiterate, here are the steps above:

1. Call `flatMap` method on the `DataResult` passed in. We will be returning a `Result<T, NetworkError>` in the closure

2. Call `Result` initializer within this closure, using the transform closure passed into the `ResultDecoder`

3. Map the error of this result to a `NetworkError`

   

------

## Examples

We can then use the `ResultDecoder` struct to create a decoder for any Result type that we need to using minimal code. In my case, I defined an instance in my network client for decoding an array of albums:

```swift
private let albumsDecoder = ResultDecoder<[Album]> { data in
    try Array(JSONDecoder().decode([String: Album].self, from: data).values)
}
```

With all this in place, using our new result handler and decoder in my `getAlbums` method looks like this:

```swift
func getAlbums(completion: @escaping (Result<[Album], NetworkError>) -> Void) {
    let request = URLRequest(url: baseURL.appendingPathExtension("json"))
    
    URLSession.shared.dataTask(with: request) { result in
        completion(self.albumsDecoder.decode(result))
    }.resume()
}
```



I can use the it for images as well by making an image decoder like so:

```swift
private let imageDecoder = ResultDecoder<UIImage> { data in
    guard let image = UIImage(data: data) else {
        throw NSError(domain: "Bad image data", code: 0)
    }
    return image
}
```

Using it is just as easy as the JSON decoder:

```swift
func getImage(with url: URL, completion: @escaping (Result<UIImage, NetworkError>) -> Void) {
    URLSession.shared.dataTask(with: URLRequest(url: url)) { result in
        completion(self.imageDecoder.decode(result))
    }.resume()
}
```



I have seen libraries and networking layers that incorporate the JSON decoding into the network call. I think this method retains more clarity though by simply returning a result that is either data or a network error. Then we can handle it how we want from there, giving us flexibility in our decoding process. Fresh eyes looking at the code should be familiar with URLSession, and will only have to understand the added extension returns a `Result<Data, NetworkError>` instead. 



------

## Alternative Extension

One thing that isn't well suited to the Result type is if you don't particularly care about the data returned. For this situation you could add an extension to URLSession for a data task that simply returns a `NetworkError?`. Thanks to our failable NetworkError initializer, that is super simple to implement:

```swift
func dataTask(with request: URLRequest, errorHandler: @escaping (NetworkError?) -> Void) -> URLSessionDataTask {
    
    return self.dataTask(with: request) { (data, response, error) in
        errorHandler(NetworkError(data: data, response: response, error: error))
    }
}
```

With this in place, my `putAlbum` method looks like this:

```swift
func putAlbum(_ album: Album, completion: @escaping (NetworkError?) -> Void) {
    var request = URLRequest(url: baseURL.appendingPathComponent(album.id).appendingPathExtension("json"))
    request.httpMethod = HTTPMethod.put
    
    do {
        request.httpBody = try JSONEncoder().encode(album)
    } catch {
        completion(.encodingError(error))
        return
    }
    
    URLSession.shared.dataTask(with: request, errorHandler: completion).resume()
}
```



------

## Conclusion

I hope this article gives you some ideas as to how you can incorporate the Result type into your networking code. Also, if there is some functionality that you wish that Apple's frameworks had, why not try adding it yourself through extensions? They are such a powerful tool that can lead to clean, easy to read code.