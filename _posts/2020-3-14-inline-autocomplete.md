---
layout: post
title: Inline Autocomplete
subtitle:
tags:
comments: true

---

This is a little project I worked on this weekend, trying to replicate the inline autocomplete that Safari on iOS features in it's search bar. The end product I was aiming for (and finally achieved) looks like this:

![](https://raw.githubusercontent.com/swift-student/swift-student.github.io/master/img/2020-3-14/inline-autocomplete.gif)

------

## The challenging parts would be:

- Keeping track of the user entered text vs the completion

- Highlighting the completion

- Causing hitting delete the first time to simply clear the completion

- Making sure that when deleting, the completion would be paused

- Hiding the cursor when there is a completion present

- Letting the "x" still perform it's job and clear all the text

  

  ------

# Setup

  

  

  So to start with, I configured my search bar like so:

  ```swift
  private func setupSearchBar() {
      navigationItem.searchController = searchController
      
      let highlightColor = tableView.tintColor!.withAlphaComponent(0.3)
      
      searchController.searchBar.searchTextField.markedTextStyle =
          [NSAttributedString.Key.backgroundColor: highlightColor]
      
      searchController.obscuresBackgroundDuringPresentation = false
      searchController.searchBar.autocapitalizationType = .words
      
      searchController.searchBar.delegate = self
  }
  ```

  Notice that I'm setting the markedTextStyle of the searchTextField. This is where you want to set the styling of the completion text that we will be filling in after the user's query. Other than that, it's a pretty standard set up. 

  

  Next, I need two instance variables to keep track of what is happening in our search bar:

  ```swift
  private var lastQuery = ""
  private var duplicateQueryCount = 0
  ```

  

------

# textDidChange

  

  Then in the `textDidChange` delegate method is where the magic happens:

  ```swift
  func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
      searchBar.tintColor = nil // 1
      
      guard !searchText.isEmpty else { // 2
          filteredNames = animalNames
          return
      }
      
      let textField = searchBar.searchTextField
      
      guard let rangeOfQuery = textField.textRange( // 3
          from: textField.beginningOfDocument,
          to: textField.selectedTextRange?.start ?? textField.endOfDocument),
          let query = textField.text(in: rangeOfQuery) else { return }
      
      guard !lastQuery.contains(searchText) else { // 4
          lastQuery = query
          return
      }
      
      if query == lastQuery { // 5
          duplicateQueryCount += 1
          guard duplicateQueryCount < 2 else { return }
      } else { // 6
          filteredNames = animalNames.filter { $0.lowercased().hasPrefix(query.lowercased())} 
          duplicateQueryCount = 0
      }
      
      if let completion = self.filteredNames.first?.suffix(from: query.endIndex) { // 7
          searchBar.tintColor = .clear
          textField.text = query
          textField.setMarkedText(String(completion), selectedRange: NSRange())
      }
      
      lastQuery = query
  }
  ```

  

  Here's how it breaks down:

  1. I first set the search bar's tint color to nil, since I am letting it get it's tint color from further up the view hierarchy. Later when setting the highlighted completion, I will make the tint color clear
  2. If the search text is empty, I simply make sure to set my filtered array to the full array of animal names and return from the method.
  3. Since the `searchText` variable passed in will also include any marked text I have added, I need to determine what text the user entered vs the completion I may have added. I do this by first getting a range from the beginning of the text field up to the cursor's position, aka `selectedTextRange?.start`, since my marked text is always inserted after the cursor. Then I use this range to extract a query string.
  4. This step is needed to make sure that when deleting, we don't keep filling in a completion. If the last query contains the search text, I know that I am deleting, and need to return from the method.
  5. This is where things may get a bit confusing. I actually expect to get the same query more than once in a row, as when I change the text to add the completion, this delegate method will get called again. This is fine, since trying to avoid the method being called twice leads to an issue where the text doesn't properly update. So I simply use a counter to make sure it doesn't get called with the same query more than twice. The only case where it would get called more than twice in a row is when the "x" button is tapped, so this code lets that button function properly and clear the text field.
  6. If we have a new, unique query, I now use that to filter the `animalNames` array into `filteredNames`. I am simply matching based on the prefix, though you could use a more sophisticated method of filtering that deletes leading whitespace, or accounts for misspellings.
  7. If there is a match in `filteredNames`, I remove the part the user entered and call this my completion. I then set the search bar's tint color to clear to hide the cursor, since I will be highlighting the completion. I then set the textField's text to the query, and set it's marked text to the completion. I use an empty range for the selection, as I don't want the completion text to have the little selection handles around it. Since we set up the marked text's appearance before, we don't have to worry about styling the completion.

It took quite a bit of experimenting with the code in this delegate method to get it performing properly. And as I mentioned, this method does end up getting called twice when I update the text, but avoiding the second call causes it to not update properly. I'm not sure how exactly Apple does it, and they may actually be subclassing UITextField, but I wanted to get it working with a UISearchBar, which meant no subclassing.



------

# Other Delegate Methods



To finish, I needed to implement two more delegate methods:

```swift
func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
    let textField = searchBar.searchTextField
    textField.selectedTextRange = textField.textRange(from: textField.endOfDocument, to: textField.endOfDocument)
}
```

This code is needed to make multi-word completions un-highlight when pressing "search". It simply moves the cursor to the end of the text field.

```swift
func searchBarCancelButtonClicked(_ searchBar: UISearchBar) {
    searchController.searchBar.tintColor = nil
    filteredNames = animalNames
}
```

And finally, when the cancel button is clicked. I set the tint color back to nil so that the cursor will appear again when tapping on the text field, and I reset my `filteredNames` to include all of the `animalNames`.



------

# Conclusion



I hope this code helps anyone looking to implement inline autocomplete into a project of their own. I didn't see much out there for information on how to achieve this look, and I realized quickly that it was going to be harder than it might appear at first glance. Feel free to reach out to me if you have any questions about this code, or have suggestions on how it could be improved!

