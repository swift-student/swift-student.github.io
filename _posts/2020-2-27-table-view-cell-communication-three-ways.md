---
layout: post
title: Table View Cell Communication Three Ways
subtitle:
tags:
comments: true

typora-root-url: ../../swift-student.github.io
---

So you have a custom table view cell with a control in it. For example, let's say that your cell has a checkmark button. When the user interacts with this button, how do you let your view controller know? Let's go over three different ways you could accomplish this task, depending on your scenario and preferences.

# Delegation

Delegation is one the main communication patterns that we see throughout Apple's frameworks, and for good reason. By using a protocol to define responsibilities for the delegate to handle, the delegator can be clear about it's intentions. It also allows for easily adding methods to the protocol, say for example we were to add additional buttons to our cell. 

Setting delgation up is simple, but requires a few steps. First we must write a protocol that will let our view controller know what messages it needs to handle.

```swift
protocol CustomTableViewCellDelegate: AnyObject {
    func toggleSomeValue(for cell: CustomTableViewCell)
}
```

Notice that I made my protocol inherit from the AnyObject protocol. This makes it so that only class types can adopt our protocol, and is an important part of using the Delegation pattern. Since we want the delegate to be a view controller, this will pose no problems to us.

Since we know that whatever adopts our protocol is going to be a reference type (class), we can then put a weak variable in our custom cell to hold a reference to a delegate. 

```swift
// Inside our custom cell

weak var delegate: CustomTableViewCellDelegate?
```

If we didn't put weak before the variable, our cell would have a strong reference to our view controller and our view controller would have a strong reference to the cell (by way of the table view). This would create what is known as a retain cycle. Since both objects would have a strong hold on each other, neither of them would ever be removed from memory.

Next, inside an IBAction linked to the checkmark button in our cell (assuming you are using storyboards), we can call the delegate with the method we defined in the protocol above.

```swift
@IBAction func checkmarkToggled(_ sender: UIButton) {
    delegate?.toggleSomeValue(for: self)
    updateViews()
}
```

When we go to dequeue a cell from our table view, we need to be sure to set our view controller as the delegate for the custom cell.

```swift
// Inside our table view controller

override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "CustomCell", for: indexPath)
    guard let customCell = cell as? CustomTableViewCell else { fatalError("Unable to dequeue expected type: CustomTableViewCell") }
  
    // Set up cell
    customCell.delegate = self
        
    return customCell
}
```



Finally, we can respond to the delegate method in our table view controller. In the code below, I made our table view controller adopt the delegate protocol in an extension to help separate this functionality from all of the other stuff that goes in a view controller. Then, as our protocol only has one method, I simply implemented that one method and used the cell that is passed in to determine the index path of the row in our model that should be updated.

```swift
extension TableViewController: CustomTableViewCellDelegate {
    func toggleSomeValue(for cell: CustomTableViewCell) {
        guard let indexPath = tableView.indexPath(for: cell) else { return }
        dataModel[indexPath.row].someValue.toggle()
    }
}
```



# Target-Action

When I happened upon [example code](https://developer.apple.com/library/archive/samplecode/Accessory/Listings/AccessoryViewController_m.html#//apple_ref/doc/uid/DTS40008066-AccessoryViewController_m-DontLinkElementID_4) for a table view cell with a custom accessory view from Apple, this is the pattern that they used, albeit in 2014. Before seeing this example, it hadn't dawned on me that interface builder actions could be made directly from a table view cell to a view controller. But then how do you figure out which cell is calling that action? Good question. Luckily table views have a method for determining the cell for a specific CGPoint, which we can get by including the event in the parameters of our IBAction. Here's how the code would look in swift:

```swift
// Inside our table view controller

@IBAction func checkmarkToggled(_ sender: UIButton, forEvent event: UIEvent) {
    guard let touch = event.allTouches?.first else { return }
    guard let indexPath = tableView.indexPathForRow(at: touch.location(in: tableView)) else { return }
    dataModel[indexPath.row].someValue.toggle()
}
```

As a note, in the example of a checkmark button, the cell would still be responsible for updating the checkmark image through an IBAction in the cell itself. However, with a normal button, the IBAction in the view controller would be all that's needed.

# Closure

This would certainly be the most modern and "Swifty" way of doing things. If our cell simply has one button, it would be super easy to just set a property that is a closure in the cell when dequeing it from the table view. Then, when the cell's checkmark button is toggled, we can simply use the closure as a callback to let the view controller know. Just as with using delegates, we need to be sure to use weak properly to avoid creating a retain cycle. We don't want the cell to end up with a strong reference to our view controller.

The syntax for making a variable that will hold an optional closure that takes a cell as it's parameter and returns void looks like this:

```swift
// Inside our custom cell 
var checkmarkToggledHandler: ((BookTableViewCell) -> ())?
```

Then inside our IBAction, we can call the closure (only if it has been set).

```swift
@IBAction func checkmarkToggled(_ sender: UIButton) {
    if let checkmarkToggledHandler = checkmarkToggledHandler {
        checkmarkToggledHandler(self)
    }
    updateViews()
}
```

Finally, we can set the closure property when dequing our cell in our table view controller:

```swift
override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "CustomCell", for: indexPath)
    guard let customCell = cell as? CustomTableViewCell else { fatalError("Unable to dequeue expected type: CustomTableViewCell") }
    // Set up cell
    customCell.checkmarkToggledHandler =  { [weak self] toggledCell in
        guard let self = self else { return }
        guard let indexPath = tableView.indexPath(for: toggledCell) else { return }
            
        self.dataModel[indexPath.row].someValue.toggle()
        self.tableView.reloadData()
    }
        
    return customCell
}
```



Notice though that before naming the first and only paremeter of the closure, I included `[weak self]`. This makes sure the closure keeps a weak reference to our table view controller. Then to not have to deal with optional chaining in the closure, I simply use a guard statement to upgrade optional self to a strong version. We are forced to type self in closures, so if the compiler complains that you didn't type `self.`, use that as your cue to make sure you aren't creating a retain cycle and include `[weak self]` if needed.

Using a closure for this scenario is a concise alternative to setting up a delegate. Where a closure would lose out to delegation though, is in the ability to neatly and easily add multiple buttons and multiple methods, which using closures could become quite messy.