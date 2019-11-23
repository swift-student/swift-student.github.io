---
layout: post
title: Going Beyond the Tutorial
subtitle:
tags: 
comments: true

---

In the process of learning software development, it is likely that one of the ways you end up learning, if not the main way, will be from tutorials. Whether written, or video format, tutorials can be a great way to learn, but come with some downsides. It can be quite easy to end up following their guidance, performing the steps they take, mindlessly copying the code they type. In the end, you may find that you haven't really absorbed what you set out to learn at all.

Right now I am working my way through [Angela Yu's iOS 13 course on Udemy](https://www.udemy.com/course/ios-13-app-development-bootcamp), and I must commend her on trying to avoid the pitfalls of tutorials. She stops regularly to give challenges for you to solve on your own before showing you the solution. There are also projects that give you no video guidance, but only a starter project and an outline giving you general guidelines. 

However, compared to Stanford's iOS course that I went through previously, Angela's course holds your hand much more. Now that's not necessarily a bad thing, especially if this is your first time learning these concepts, but in order for me to get the most out of this course, I have to push myself beyond the tutorial. And that's exactly what I have been doing the past few weeks.

### Work Ahead of The Instructor

One of the most simple ways to get more out of tutorials is to pause the video (or stop reading) at a point where you know where the project is headed and attempt to build things out on your own. This is especially useful when you have already implemented the techniques shown in an early project, and forces you to use them again from memory and build repetition instead of just mimicking what the instructor does.

Depending on how well you remember what you are doing, and how you learned it previously, your implementation could, and most likely will come out slightly different than the instructor's. Maybe it's just something as simple as using different variable or function names, or maybe you used a closure as a callback method while the instructor used a protocol. Make note of those differences. If you feel like the instructor's method was better, try implementing things their way. Do a google search and try to dig up articles comparing the ways you differed.

Using this technique can help you cement things you know already further into your brain, and help you learn from your instructor other ways of doing things than what you are used to. If the instructor explains why they did things the way they did (as any good instructor should) take careful note. However, if they don't explain something, take time to pause the video and think about and research why they might have differed from you.

### Break Things

Sometimes the best way to learn how something works is to see what it takes to make it not work. Don't be afraid to veer off-course and see what happens. When something breaks, and eventually something will, figure out why. Look up compiler errors and try to understand exactly why your code won't build. When your app crashes, practice debugging to find your mistake and understand why it caused a crash. 

You should always be trying to learn things as you would in the real world in a job scenario. When you are working on your company's app, you won't have a tutorial to fall back on. When things break, you will need to figure out how to fix them on your own. Sure, you might be working with other developers who can help you out when you get stuck. However, if you don't take the initiative to try things on your own before turning to them for help, not only are you going to miss out on learning valuable skills, but they will likely become quickly annoyed with constantly holding your hand.

### Mix Tutorials

I'm not sure how common this is for other people to do, but I find myself mixing tutorials quite often. While browsing in my spare time, I add tutorials I find interesting on YouTube to my watch later list, and bookmark articles that I find in Safari. Then when I go to work on a tutorial in the course I am working through, I try to incorporate those techniques from other places into the project at hand. 

Often times as the instructor is showing what the final product will be in the first video of a tutorial, a mental lightbulb will turn on, reminding me of a tutorial that would be perfect to integrate into this project. I will then try to integrate the technique from that video or article into whatever I am building for the tutorial. Then I will watch how the instructor builds things out, and compare methodology. Often times I will go back and build things out their way as well, so that I get practice doing things multiple ways.

As an example, the most recent way I mixed tutorials was incorporating [Paul Hudson's tutorial on the coordinator pattern](https://www.youtube.com/watch?v=7HgbcTqxoN4&t=920s) into a chat app I'm working on in Angela's course. Instead of using segues as Angela does, which I am quite comfortable with, I learned how to move navigation out of the view controller into something called a coordinator. This forced me to get practice with protocols, instantiating and navigating between view controllers programmatically, and dive into the new scene delegate file for the first time.

And when it came to following Paul's tutorial, I tried mixing things up as well. He was using a navigation controller, so I tried using a coordinator without one. This caused me to have to restructure things a bit. Ultimately, I came back to using a navigation controller as that's what the app required, but I wanted to see how things would work in different situations. Ultimately the point of a tutorial is to learn, not to just get through it, so don't be afraid to take time to explore different avenues, even if they aren't the best fit for the app you are working on.

### Add Features

After completing a tutorial I will often think of features that can be added, as many tutorials leave you with a bare bones product after completion. Maybe I can add something as simple as an animation that makes the experience feel better, or as complicated as incorporating an API to show additional information. Adding features to an app can be a great way to learn as you no longer have the tutorial to fall back on. It's now up to you to build things out, likely break them, hopefully fix them, and get practice making things on your own.

### Build Something On Your Own

Speaking of which, the last step to going beyond the tutorial is to do just that: build something on your own. Make your own app, start to finish. This is easier said than done, but we all need to take that leap at some point from following tutorials or completing assignments in a course to building something of our own design. Your app doesn't have to be totally unique, as ideas rarely are. Just pick something simple, and get started.

As I type this, I can't help but feel a little bit odd, as I haven't built anything on my own from start to finish. However I plan to rectify that over the next couple months before I start at Lambda by building my own budget app. I have been frustrated by the apps I have tried downloading from the app store. Almost all require signing up to a service, some require linking bank and credit card accounts, most are complicated, and practically none work the way I would want them to. Thus, I have decided to build my own.

So be on the lookout for posts of my progress as I brainstorm, learn about user flow and wireframing, and ultimately begin designing and building my first app!

