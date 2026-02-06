# Week in review — 2026-01-09 (Friday)

0:00 Hey, this is my weekly update. I just wanted to go through at a high level what I worked on this week, and then also do a quick demo of WebGiving, because that's what I spent the majority of my week working on.
0:09 So, uh, first off, some stats. Uh, this week, I merged 21 PRs. I had 25 total PRs that were created or updated.
0:17 That means that I had 4 that I closed out, either because the issue was solved or it was an unnecessary PR.
0:23 also reviewed 16 PRs, um, that got merged. I had 29 linear issues that I completed and 35 total linear issues that I worked on, which means that I either, like, commented or changed something on it.
0:36 Um, so that's, uh, most of the work was done in Apollos Admin, specifically on web. Uh, but I also did work on cluster, um, on cluster.
0:44 I had one PR that dealt with, um, setting Apollos user true. Um, correctly in a couple of situations, which we bumped into, uh, on web.
0:53 Okay, um, high level for this week, um, all of these things that you see on web giving, um, are issues mostly related to, uh, a completely revamped experience on web giving, um, from a UI, uh, perspective.
1:11 And this also. Include some serious work with, uh, debugging our session cookies with Vincent to get those working correctly. Um, Uh, it could be experienced more likely with developers, but because we're experiencing it, we want to make sure that we're covering our bases and make sure that this is like
1:29 a really, uh, solid system, uh, for all of our users as well, so that they are not running into the same stuff that we were seeing locally.
1:36 Okay. Um, I'm not going to go through each of these. Uh, you can pause and read this if you'd like, um, but that gives you a high level, uh, understanding of what I've been working on with WebGiving.
1:44 Um, this Auth on WebGiving is related to that, uh, session cookie issue. And then these issues and a Pulse Admin are also related to, um, those UI changes that we had going in, um, for WebGiving.
2:00 Okay. So, uh, that's what I got working on. I'm not going to talk about these review PRs. Again, if you want to pause this, you can read this.
2:05 That's fine. Okay. So let's jump into a quick demo. So this is, uh, a local, uh, instance of WebGiving. I'm going to go ahead and show you that you can see it in light or dark mode.
2:19 Either one works, um, on all the pages. Um, so we're going to go through this. Peace. I am not logged in right now.
2:26 I'm selecting a campus, selecting an amount. I can select a fund if I'd like. I can make it recurring. Let's go ahead and make it weekly, starting today.
2:36 Okay. I'm being prompted to log in. I can log in with email or phone. Thank you very much. 688.
2:52 Okay. So I'm logging in now and getting my email address because my person profile does not have an email. Okay.
3:02 And 30 and schedule my gift. There you go. Um, that's the entire flow. I'm going to do it one more time just so you can see it in dark mode.
3:15 Um, let's do, wait, no, no, I don't want to show dark mode or no, we can just, let's show it in mobile.
3:24 Actually I'll do dark mode in mobile. How about that? All right. So here we go. I'm going to go through this again.
3:37 Laptop is not the right size. Okay. Can we, thank you. There we go. Sorry. You had to see me struggle there for a second.
3:48 Um, okay. And I'm going to make this five bucks. Uh, recurring? Sure. Why not? Weekly. Today.
4:00 Give me five bucks. Alright. Email address. Oh, there's your card. A lot of this UI on this page didn't change except for the colors.
4:18 Special. Process. There you go. Alright. So that's the flow on. WebGiving. There are a couple other pages that I didn't demo just because it's honestly difficult to get my local database in the right state so I can show you merge profiles and stuff like that, but there are videos that exist on Slack.
4:35 If you want to check it out, you can find those and see those demoed. That's what I got for this week.
4:41 Next week, we'll be trying to wrap up this web, um, WebGiving project. There's not much left on it, actually. Can I pull it up real quick?
4:52 Sure. Let's come over here and look at it. Um, so for here, we got one issue left, which is our loading state issues.
5:00 You could probably see it if you watch this video slowly, but we have a couple spots where you're seeing some flashing going on, and it's going to take a pretty large number of refactored to get this working a little bit nicer, um, but I do have some of that work locally staged so that I can kind of 
5:21 start to stress test it. Next week is going to be probably validating if we want to go that route or not, um, or if we want to try to find a different solve for these flashing loading states that you can sometimes see.
5:32 Okay, so that's all I got for this week. I will catch you later. Bye.