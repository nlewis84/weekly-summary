# Week in review — 2026-01-23 (Friday)

0:00 What's up everybody, this is my week in review. Just wanted to go through some stats for me. Uhm, this week I had 25 PRs that were merged.
0:11 Not bad, especially since it was a short week. Uhm, 31 PRs that were created or updated, which means that I had a couple PRs that I commented on, uhm, or closed.
0:21 Uhm, or, actually I've got a couple PRs that are just, just testing for cell issues. Uhm, and then 21 PR reviews, uhm, linear issues completed was at 29 for the week, and linear issues worked on was 33.
0:35 All of my work this week was in the admin repo. Uhm, okay, so we're looking at most of my work today, and a little bit less yesterday, and periodically the rest of the week as well, was trying to figure out what's going on with, uhm, our time-to-paint issues, uhm, in web.
0:54 Uhm, so if I can demo this for you, we're gonna go to polis.com, and hopefully we're gonna get some issues to show Uhm, so, uh, a couple, a couple notes, uh, the footer has been adjusted here, uh, so now the text is down in the bottom, some of the updates to the text here, uhm, and we got rid of the 
1:17 secure and encrypted, uh, badge. Alright, so we're here, uh, hit this, and do this. You can see that loading took for, took a second, that wasn't as bad as it has been, so we're gonna log out, and we're gonna try this again, and see if we can get it to be really long.
1:36 Maybe, we're just gonna be really lucky today. Uhm, and as I'm going through this, you're getting to watch all of the different flows, uhm, any small tweaks that you're gonna see throughout, uhm, this, uh, for instance, this button used to be inside of here, and we got rid of this, we switched it, uhm
1:55 , I, uh, missed requirements on that, uh, I did it backwards, so it doesn't matter. This button needed to stay, so it's back, and it's not here.
2:03 Uhm, okay, that was actually relatively fast. Let's try this again. Maybe we're gonna get, eventually, a long load. That was not it.
2:12 Uhm, so, this is me demoing this working about the way that I would expect it to work. Because this is pretty comparable to what's going on locally.
2:21 Everything's working pretty fast, uhm, I'm gonna refresh this, hit it one more time. Relatively fast. This is, this is actually really nice that I'm demoing it, and it's, uh, it's working in a way that, uhm, doesn't embarrass me.
2:37 So, uhm, yeah, sometimes it works, and sometimes it doesn't. Usually at about 11 o'clock, uh, Central Time, it doesn't work.
2:46 And it's really pretty painful to use. Uhm, but if this was my experience as a user, uh, I wouldn't think twice about the performance of, of this at all.
2:56 Uhm, I pay bills once a month, and some of the websites that I use to pay bills work tremendously slower than this.
3:05 So, this is, this is not bad. Uhm, so, I just wanted to show you that, that's, I've been kind of, uh, trying to figure out what's going on with that.
3:12 And, uh, my name demo of that, uh, didn't demo anything, because it's working just fine. Uh, we did notice that, uh, today I found this issue, that we have this cold start issue in Vercel.
3:27 Basically, the function, uh, doesn't fire off when it's supposed to. It takes a couple seconds for the, uh, function to actually kick off.
3:37 Uhm, so, that's a cause of some of the loading issues that we're seeing inside of web on, uh, uh, uh, giving on web.
3:44 Uhm, so, we're gonna be talking to Vercel about that, and see if we can do anything to figure it out and make it better.
3:53 Uhm, I turned on, actually Vincent turned on, something called, we found something called Fluid Compute in Vercel. Thank you. And, so, we've got that running now, uhm, we've got some updates that have gone out for, uhm, better error reporting and also better tracking of the request, uhm, as far as logs
4:13 go, so that we can track how long things are running, and, uhm, this isn't a branch, but it's got some, like, test logs in here, but, like, we're checking, I was, today, I spent pretty much the whole day just looking at different timing on requests that are coming in, and, and comparing it to the information
4:30 that's in Vercel, and seeing if there's any discrepancies with that, and trying to figure out exactly what the issue is with, uhm, with this.
4:37 So, uhm, I demoed pretty much, like, where we are, uhm, inside of, uh, web in production, so I feel pretty good about that, uh, and feel pretty good about where we are, the information that I've gotten so far, uhm, for trying to track down, like, why this is going so slow, uhm, and hopefully, you know
4:58 , next week, we can get some information from, uh, from Vercel that'll help us better debug this, and figure out what's going on.
5:06 I'm just gonna do it one more time. Maybe, maybe we got lucky today. I don't know. We'll see. That was, fine.
5:17 Okay, that's my video. It's all working. And it's, uh, it's not embarrassing. So, alright. I'll, uh, see y'all maybe on Monday.
5:25 Maybe Tuesday. I don't know. We'll see. We'll see what this weather's like. Bye.