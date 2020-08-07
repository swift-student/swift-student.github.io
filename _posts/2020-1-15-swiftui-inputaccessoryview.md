---
layout: post
title: SwiftUI InputAccessoryView
subtitle:
tags:
comments: true

typora-root-url: ../../swift-student.github.io
---

### Update: I created a [repo for this project here](https://swiftstudent.com/2020-01-15-swiftui-inputaccessoryview/)

Between moving into a new apartment, my wife getting a new job, trying to get my last few projects finished at my job, and the holidays, life has got in the way of me keeping up on blogging for a bit. However, I've tried to keep working on my budget app where I can, and though I haven't made a ton of progress on the app, I have learned quite a bit about SwiftUI. See, I decided since this is a personal project and I'm not too worried about supporting older versions of iOS, I would try my hand at using SwiftUI. 

In some ways, SwiftUI can speed up development, and lead to writing less code. However, when you need a feature that isn't provided yet, or run into a bug, you can spend hours or even days trying to solve your problem. At this point, I'm quite positive that I could re-create what I have so far in a matter of hours using UIKit, and I have been tempted multiple times to abandon ship and go back to it. However, I've stuck it out with SwiftUI, and I have a few tidbits that I will try to share in hopes that they might help others.

In creating my app, I wanted to have an InputAccessoryView on my textfields that allowed navigation between and dismissal of TextFields similar to that of Safari when filling out a form:

![](/img/2020-1-15-swiftui-inputaccessoryview/safari-form.jpg)

SwiftUI's TextField does not currently support adding an InputAccessoryView, which means we will have to use UIViewRepresentable to wrap a UITextField instead. So, to get started I'm going to create a struct called SSTextField, and make it conform to the UIViewRepresentable protocol. I'm going to implement all of the methods in the protocol so I will go ahead and stub them out, as well as creating a class called Coordinator, which will essentially act as our view controller for the UITextField.

```swift
import SwiftUI

struct SSTextField: UIViewRepresentable {
    
    //MARK: - Lifecycle Methods
    
    func makeCoordinator() -> SSTextField.Coordinator {
        return Coordinator()
    }
    
    func makeUIView(context: UIViewRepresentableContext<SSTextField>) -> UITextField {
        return UITextField()
    }
    
    func updateUIView(_ uiView: UITextField, context: UIViewRepresentableContext<SSTextField>) {
        
    }
    
    static func dismantleUIView(_ uiView: UITextField, coordinator: SSTextField.Coordinator) {
        
    }
    
    //MARK: - Coordinator
    
    class Coordinator: NSObject {
        
    }
}
```
In order to mimic SwiftUI View's ability to use modifiers, I'm going to create a view model within our struct which will allow us to modify variables, since the struct can't be mutable and still conform to the UIViewRepresentable protocol. Here's what that looks like:

```swift
    class ViewModel {
        var placeholder: String
        var text: Binding<String>
        var font: UIFont?
        
        init(_ placeholder: String, _ text: Binding<String>) {
            self.placeholder = placeholder
            self.text = text
        }
    }
```

Then, in our struct, we can create a variable for our view model and create an initializer which passes along the placeholder and text:

```swift
    private var model: ViewModel
    
    init(_ placeholder: String, text: Binding<String>) {
         model = ViewModel(placeholder, text)
    }
```

Notice that I've made the text a Binding\<String\>. This means that the SSTextField doesn't create a copy of the string passed in as a normal value type would. It will instead modify the value stored in some other location that is passed in. Additionally, the font variable is optional which we will make use of by creating our own sort of view modifier:

```swift
    //MARK: - Modifiers
      
    func font(_ font: UIFont) -> SSTextField {
        model.font = font
        return self
    }

```

This is very similar to the function SwiftUI uses for it's modifier, only it takes a UIFont vs. a Font. Later, we will update our UITextField in the updateUIView method. You can follow this same pattern to modify other aspects of your text field. Let's go ahead and add a variable for an accessory view controller, which we will be passing in, and a "modifier" to match. The modifier will take the controller as well as a tag which will let us know which order the text fields on our screen are in. This will bring our code up to the following:

```swift
struct SSTextField: UIViewRepresentable {
    class ViewModel {
        var placeholder: String
        var text: Binding<String>
        var font: UIFont?
        var accessoryViewController: TextFieldAccessoryViewController?
        var tag: Int?
        
        init(_ placeholder: String, _ text: Binding<String>) {
            self.placeholder = placeholder
            self.text = text
        }
    }
    
    private var model: ViewModel
    
    init(_ placeholder: String, text: Binding<String>) {
        model = ViewModel(placeholder, text)
    }
    
    //MARK: - Modifiers
      
    func font(_ font: UIFont) -> SSTextField {
        model.font = font
        return self
    }
    
    func accessoryViewController(_ avc: TextFieldAccessoryViewController, tag: Int) -> SSTextField {
        model.accessoryViewController = avc
        model.tag = tag
        return self
    }
```

For our accessoryViewController , I created a TextFieldAccessoryViewController class. I made this a UIHostingController so that I can use a SwiftUI View as our accessory view. The controller makes more sense if we look at the view itself first:

```swift
struct TextFieldAccessoryView: View {
    
    var textFields = [UITextField]() {
        // Order our textfields in the array by their tag
        didSet {
            textFields.sort(by: {$0.tag < $1.tag})
        }
    }
    
    var currentTextFieldTag = 0

    var body: some View {
        HStack {
            Button(action: previousTextField, label: {
                Image(systemName: "chevron.up")
            })
                .disabled(currentIndex() == 0)
                .padding()
            Button(action: nextTextField, label: {
                Image(systemName: "chevron.down")
            })
                .disabled(currentIndex() == textFields.count - 1)
            Spacer()
            Button(action: dismissCurrentTextField, label: {
                Text("Done")
            })
            .padding()
        }.accentColor(.blue)
    }
    
    func currentIndex() -> Int? {
        self.textFields.firstIndex(where: {$0.tag == self.currentTextFieldTag})
    }
    
    func nextTextField() {
        if let currentIndex = currentIndex(), currentIndex + 1 < textFields.count {
            textFields[currentIndex + 1].becomeFirstResponder()
        }
        else {
            dismissCurrentTextField()
        }
    }
    
    func previousTextField() {
        if let currentIndex = currentIndex(), currentIndex > 0 {
            textFields[currentIndex - 1].becomeFirstResponder()
        }
    }
    
    func dismissCurrentTextField() {
        if let currentIndex = currentIndex() {
            textFields[currentIndex].resignFirstResponder()
        }
    }
}
```

So the basic structure of this view is pretty simple. It consists of a horizontal stack of a an up chevron, a down chevron, and a done button. I use the accent color on these buttons, so that when disabled they are automatically gray. 

Of note is the way I track the text fields managed by this accessory view. I sort the array that they are stored in according to the tag. Then when advancing to the next text field or going back to the previous one, I use the index of the current view controller (finding it using it's tag), and add or subtract one to find the correct index. 

Doing it this way versus just going up or down using the tag allows for adding or removing text fields in our UI. It doesn't matter if our tags are 1, 2, 3, or 1, 3, 5, it will still work properly.

The controller looks like this:

```swift
import SwiftUI
import UIKit

class TextFieldAccessoryViewController: UIHostingController<TextFieldAccessoryView> {
    
    convenience init () {
        self.init(rootView: TextFieldAccessoryView())
    }
    
    private override init(rootView: TextFieldAccessoryView) {
        super.init(rootView: rootView)
        view.frame = CGRect(x: 0, y: 0, width: 0 , height: 40)
        view.backgroundColor = .darkGray
    }
    
    @objc required dynamic init?(coder aDecoder: NSCoder) {
          fatalError("init(coder:) has not been implemented")
    }

    func addTextField(_ textField: UITextField) {
        rootView.textFields.append(textField)
    }
    
    func removeTextField(_ textField: UITextField) {
        rootView.textFields.removeAll(where: {$0 == textField})
    }
    
    func setCurrentTextFieldTag(_ tag: Int) {
        rootView.currentTextFieldTag = tag
    }
    
    func advanceToNextTextField() {
        rootView.nextTextField()
    }
}
```

So first off, I am overriding the default init method and setting the height of the view and it's background color. Then I simply make some functions that allow us to interface with the View. With this in place we can focus our attention on finishing our UIViewRepresentable implementation:

```swift
    
    //MARK: - Lifecycle Methods
    
    func makeCoordinator() -> SSTextField.Coordinator {
        return Coordinator(self)
    }
    
    func makeUIView(context: UIViewRepresentableContext<SSTextField>) -> UITextField {
        let textField = UITextField()
        textField.delegate = context.coordinator
        
        if let accessoryViewController = model.accessoryViewController, let tag = model.tag {
            textField.inputAccessoryView = accessoryViewController.view
            textField.tag = tag
            accessoryViewController.addTextField(textField)
        }
        
        return textField
    }
    
    func updateUIView(_ uiView: UITextField, context: UIViewRepresentableContext<SSTextField>) {
        let textField = uiView
        textField.placeholder = model.placeholder
        textField.text = model.text.wrappedValue
        textField.font = model.font
    }
    
    static func dismantleUIView(_ uiView: UITextField, coordinator: SSTextField.Coordinator) {
        let textField = uiView
        if let accessoryViewController = coordinator.parent.model.accessoryViewController {
            accessoryViewController.removeTextField(textField)
        }
    }
```

If you notice that we are now passing self to the coordinator when we create it, we will use this reference later in the coordinator to refer back to its "parent". Then in makeUIView, we check for an accessoryViewController, and if there is one we set our text view's tag, and add it to our accessory view. In updateUIView we are simply updating our view using our model. Finally in dismantleUIView we are just removing our text field from the accessory view.

```swift
   //MARK: - Coordinator
    
    class Coordinator: NSObject, UITextFieldDelegate {
        var parent: SSTextField
        
        init(_ parent: SSTextField) {
            self.parent = parent
        }
        
        func textFieldDidBeginEditing(_ textField: UITextField) {
            if let accessoryViewController = parent.model.accessoryViewController {
                accessoryViewController.setCurrentTextFieldTag(textField.tag)
            }
        }

        func textFieldDidChangeSelection(_ textField: UITextField) {
            if let text = textField.text {
                parent.model.text.wrappedValue = text
            }
        }
        
        func textFieldShouldReturn(_ textField: UITextField) -> Bool {
            if let accessoryViewController = parent.model.accessoryViewController {
                accessoryViewController.advanceToNextTextField()
            }
            return true
        }
    }
```

To start, we make our coordinator a UITextFieldDelegate. Then, as I mentioned, we keep a reference to our parent. Since the system keeps track of our coordinator and we never store a reference to it ourselves, this does not create a retain cycle. Then in our coordinator we simply implement a few delegate methods to let our accessory view know when we begin editing, update our text every time something is typed, and tell our accessory view to advance when return is pressed.

Finally, we can use our new text field to create a simple form:

```swift
import SwiftUI

struct ContentView: View {
    
    let accessoryViewController = TextFieldAccessoryViewController()
    let font = UIFont.systemFont(ofSize: 20)
    
    @State var firstName = ""
    @State var lastName = ""
    @State var age = ""
    @State var favoriteColor = ""
    
    var body: some View {
        Form {
            SSTextField("First Name", text: $firstName)
                .font(font)
                .accessoryViewController(accessoryViewController, tag: 0)
            SSTextField("Last Name", text: $lastName)
                .font(font)
                .accessoryViewController(accessoryViewController, tag: 1)
            SSTextField("Age", text: $age)
                .font(font)
                .accessoryViewController(accessoryViewController, tag: 2)
            SSTextField("Favorite Color", text: $favoriteColor)
                .font(font)
                .accessoryViewController(accessoryViewController, tag: 3)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

```

Here you can see our "modifiers" at work. In addition to a font, I pass in our accessory view controller to each text field along with a tag to indicate order. And we can see the result here:

![](/img/2020-1-15-swiftui-inputaccessoryview/input-accessory-test.png)

If you have any suggestions on improvements to this code, feel free to let me know! I am still just learning SwiftUI and app development in general, and this is by no means written from an expert point of view. In the coming weeks, I will share some other tips I have picked up along the way. SwiftUI is neat, but still has a long way to go both in features, and documentation. I can definitely see the advantages though, and will continue trying to learn it through building a budget app.