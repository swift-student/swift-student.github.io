---
layout: post
title: GraphQL Networking Using URLSession
subtitle:
tags:
comments: true
typora-root-url: ../../swift-student.github.io



---

As we were working on breaking down the user stories we had generated for our Eco-Soap Bank app into tasks, we came to a decision that needed to be made regarding the GraphQL networking: Should we use the popular Apollo framework to handle communication with our stakeholder's GraphQL back end, or should we write our own networking code using URLSession? After consulting with some peers who had previously worked with GraphQL, as well as an experienced iOS instructor, we decided to write our networking layer using URLSession. The major hurdle for doing this was that there is not much information out there on using URLSession with GraphQL, which is what I am hoping to remedy with this article.

------

# GraphQL Basics

Before we jump into writing code to interact with a GraphQL server using URLSession, let's first take a look at the basics of how GraphQL is set up. In comparison to a traditional REST API, GraphQL uses a single endpoint to serve all of the data. You interact with this endpoint using operations which can be of the types query, mutation, or subscription. In our case, we only used queries and mutations, and so for the purposes of this introduction, we will concentrate mainly on performing  a query. You can think of a query as being equivalent to a GET where you are asking for data, and a mutation being equivalent to either a PUT, POST, or DELETE, where you are modifying data on the server. That being said, all GraphQL operations are done using POST as the HTTP method.

GraphQL operations have their own syntax that we will now take a look at. Here is an example query [from the docs](https://graphql.org/learn/queries/):

```
query HeroNameAndFriends {
  hero {
    name
    friends {
      name
    }
  }
}
```


Let's break this down into placeholders so that you can see what each of the components of this query are doing:

```
<#operationType#> <#OperationName#> {
  <#operation#> {
    <#field#>
    <#nestedObject#> {
      <#subfield#>
    }
  }
}
```


* **operationType**: Either `query`, `mutation`, or `subscription`.
* **OperationName**: A custom name for this operation, does not have to match anything on the server.
* **operation**: The name of the query or mutation you would like to perform, must match the server.
* **field**: You must specify at least one field that you are interested in querying or mutating.
* **nestedObject**: In GraphQL, you can nest objects to within a query or mutation. In the above example, they are requesting not only the hero but also the names of the hero's friends.
* **subfield**: You must also specify the fields you are interested in for each nested object.

The docs give the following as the resulting JSON from the above query:

``` json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

So you will notice first of all, that the top-level structure of this JSON is an object, and then inside that, we have the results listed under the key "data". If there were errors encountered, those will be returned under the key "errors". Also notice that we got back a list of friends for our hero, R2-D2. Rather than having to first request the hero, and then request the hero's friends, we did it all in one request. Also, notice that the only info we got for each friend (and the hero) is their name, and not their height, gender, or any other info. That's because we only included the name field in our query. With GraphQL, you will only receive the specific fields that you request, even if there are many more.

Before we move on, there's one more thing we must look at. Many operations will also take arguments, which we supply to GraphQL in the form of variables. Say that the above query for a hero took an argument for which episode of Star Wars to consider. Again coming from the docs, here is an example:

```
query HeroNameAndFriends($episode: Episode) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

And again, here is it broken down with placeholders:

```
<#operationType#> <#OperationName#>(<#$variableName#>: <#VariableType#>) {
  <#operation#>(<#argumentLabel#>: <#$variableName#>) {
    <#field#>
    <#nestedObject#> {
      <#subfield#>
    }
  }
}
```

* **$variableName**: A name chosen for the variable to be passed into the operation. Does not match anything on the server. The dollar sign is needed to indicate that this a dynamic value that will be passed in a separate JSON dictionary.
* **VariableType**: The type of the variable being passed in, must match the expected argument type of the operation.
* **argumentLabel**: Equivalent to an argument label when calling a Swift function. As with the type, the argument label must match the server.

So then we must pass the necessary variables in using JSON like so:

``` json
{
  "episode": "JEDI"
}
```

______

# GraphQL Playground

Now that we have an idea of the basic structure of a GraphQL operation, let's see about making a simple request. For the purposes of this example, we are going to be using an API called GraphQLZero, which will allow us to get mock data from a real backend. You can [read about the API here](https://graphqlzero.almansi.me), and find the [actual endpoint here.](https://graphqlzero.almansi.me/api) If you visit the endpoint in your browser, you will notice that a GraphQL playground interface appears, which lets you test out operations in a simple environment as well as see the docs a schema on the right-hand side. Playgrounds are an awesome feature of GraphQL and replace testing with something like [Insomnia](https://insomnia.rest) in a normal REST API while having the benefit of the docs being available for reference in the same web interface.

Let's start with a very simple [example taken from GraphQLZero's docs](https://graphqlzero.almansi.me/#example-top) to fetch a post, only we will use a variable to pass in the post id. In the GraphQL playground interface we are going to enter the following GraphQL request:

```
query Post($id: ID!) {
  post(id:$id) {
    id
    title
    body
  }
}
```

And then below in the Query Variable's section, we will enter the following JSON to specify that we are interested in getting the post with the id "1":

```json
{
  "id": "1"
}
```

Having entered these, if you press the play button, you should receive a response back that looks something like the following:

``` json
{
  "data": {
    "post": {
      "id": "1",
      "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
    }
  }
}
```

------

# Xcode Playground

So now we need to figure out how to translate all this into a network request using URLSession. Let's start by making a new Xcode playground. I am going to try to keep things as simple as possible while still showing you how to set up a system that will be flexible, extensible, and avoid repeated code.

Let's start by first defining the object that we will be expecting back from our GraphQL query, a `Post`:

``` swift
struct Post: Decodable {
    let id: String
    let title: String
    let body: String
}
```

Simple enough. *However*, as we saw above, this object will be nested in a dictionary under the key "data", and then another key "post". Let's create a generic wrapper for decoding objects we get back from GraphQL, that will also allow us to handle any error messages that are sent back:

``` swift
struct GraphQLResult<T: Decodable>: Decodable {
    let object: T?
    let errorMessages: [String]
    
    enum CodingKeys: String, CodingKey {
        case data
        case errors
    }
    
    struct Error: Decodable {
        let message: String
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        let dataDict = try container.decodeIfPresent([String: T].self, forKey: .data)
        self.object = dataDict?.values.first
        
        var errorMessages: [String] = []
        
        let errors = try container.decodeIfPresent([Error].self, forKey: .errors)
        if let errors = errors {
            errorMessages.append(contentsOf: errors.map { $0.message })
        }
        
        self.errorMessages = errorMessages
    }
}
```

As you can see, we are using a generic type `T` so that we can decode objects of any type in the future, and not just Posts. If you haven't seen custom decoding before, [you can read up on it here](https://developer.apple.com/documentation/foundation/archives_and_serialization/encoding_and_decoding_custom_types). Basically, we are simply decoding an object if one is returned and an array of any error messages that may have been returned as well. As a note, you *can* get error messages back even if an object is successfully returned.

Ok, now that we have the output side of things defined, let's look at our input. We are going to be sending an ID as our variable, which is simply a `String`. Remember though from the JSON above, that this must be nested in an object (or a dictionary), so let's create one for that purpose:

``` swift
struct IDInput: Encodable {
    let id: String
}
```

Now we are going to set up a way to create multiple operations in an easy fashion. In the Eco-Soap Bank app I recently worked on, I used an enum to accomplish this task. However, Jon Bash has offered up an [elegant solution on his blog here](http://jonbash.com/blog/protocol-witnesses/) that we are going to use for this example. We will begin by creating a struct to define an operation, making it generic over both an `Input` type, and an `Output` type:

``` swift
struct GraphQLOperation<Input: Encodable, Output: Decodable>: Encodable {
    var input: Input
    var operationString: String
    
    private let url = URL(string: "https://graphqlzero.almansi.me/api")!
```

You can see that the `Input` type is used immediately in the struct for the `input` property, however, the `Output` type is not used. This is called a "phantom type", which you can read more about at [Hacking With Swift](https://www.hackingwithswift.com/plus/advanced-swift/how-to-use-phantom-types-in-swift). It will let us later use this type when performing the operation.

Next, let's make our operation conform to Encodable:

```swift
    enum CodingKeys: String, CodingKey {
        case variables
        case query
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(input, forKey: .variables)
        try container.encode(operationString, forKey: .query)
    }
```

This simply encodes the `input` to the key "variables" and the operation string to the key "query" (which works for mutations as well). Let's also write a method to allow the operation to generate it's own `URLRequest`:

``` swift
    func getURLRequest() throws -> URLRequest {
        var request = URLRequest(url: url)
        
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(self)
    
        return request
    }
}
```

Now we can make extensions for each operation we want to define. In this extension we will define the `Input` and `Output` types, and define a static factory method to create the operation. Here's what that looks like for fetching a post:

```swift
extension GraphQLOperation where Input == IDInput, Output == Post {
    static func fetchPost(withID id: String) -> Self {
        GraphQLOperation(
            input: IDInput(id: id),
            operationString: """
                query Post($id: ID!) {
                  post(id:$id) {
                    id
                    title
                    body
                  }
                }
            """
        )
    }
}
```

So we say in our extension that the input is going to be an `IDInput` and the output is going to be a `Post` using the `where` clause syntax which you can [read about in the Swift docs here](https://docs.swift.org/swift-book/LanguageGuide/Generics.html). Then we define a function that takes an id, and returns `Self`, which the compiler will infer to be `GraphQLOperation<IDInput, Post>`. In this function, we simply make a GraphQLOperation passing in an `IDInput` using the id provided, and the appropriate GraphQL operation string that I simply copied from the playground webpage. 

Having the query strings be literals like this is not the most elegant solution, and could most certainly be improved upon. For our Eco-Soap Bank app though, it worked well enough. One of my partners, [Christopher DeVito](https://www.linkedin.com/in/christopher-devito/) developed a system for us using caseless enums to hold all of the operations and string interpolation to avoid repetition. I experimented with generating the strings in code, but found it to be more work than it was worth at the time, and ended up sticking with what was working.

The final bit of setup is to write a function to perform an operation. This would likely go in your network controller (or whatever you may call it), but we will just write it at the top level of our playground. This function will take in a GraphQLOperation and call a completion handler with a Swift Result containing either an object of type `Output` or an `Error`.

``` swift
func performOperation<Input, Output>(_ operation: GraphQLOperation<Input, Output>,
                                     completion: @escaping (Result<Output, Error>) -> Void) {
    let request: URLRequest
    
    do {
        request = try operation.getURLRequest()
    } catch {
        completion(.failure(error))
        return
    }

    URLSession.shared.dataTask(with: request) { (data, _, error) in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: 0)))
            return
        }
        
        do {
            let result = try JSONDecoder().decode(GraphQLResult<Output>.self, from: data)
            if let object = result.object {
                completion(.success(object))
            } else {
                print(result.errorMessages.joined(separator: "\n"))
                completion(.failure(NSError(domain: "Server error", code: 1)))
            }
        } catch {
            completion(.failure(error))
        }
        
    }.resume()
}
```

If you've done networking using `URLSession` before, this should look fairly familiar. The error handling could be improved by creating an enum that conforms to the `Error` protocol, but again, I'm trying to keep things simple for the sake of this example. Notice that the way we set up our GraphQLOperation enables us to perform any operation with this one shared method. Our input and output types are fully defined by the operation, leveraging the power of generics.

Everything we've written up until now may seem like a lot of setup, but in the end, it enables us to fetch and print a `Post` to the console with these simple lines of code:

``` swift
let fetchPostQuery = GraphQLOperation.fetchPost(withID: "1")

performOperation(fetchPostQuery) { result in
    switch result {
    case .success(let post):
        print(post)
    case .failure(let error):
        print(error)
    }
}
```

From here, creating more queries or mutations is as simple as defining your input and output types and writing appropriate extensions on GraphQLOperation. Using the examples given by GraphQLZero, try writing code to get a User or create a Post! The amount of work necessary should be rather minimal now that the groundwork is laid.

# Wrap Up

I hope this guide helps you begin to understand how to interact with GraphQL APIs using URL Session. While Apollo is a very popular framework for doing this, there are likely cases where you would like to avoid having a third party dependency. I have posted a Gist with [all of the code from this example here](https://gist.github.com/swift-student/84297bc17e7d2150c69643f172df052a). If you have any questions or suggestions, feel free to hit me up on Twitter [@swift_student](https://twitter.com/swift_student)!