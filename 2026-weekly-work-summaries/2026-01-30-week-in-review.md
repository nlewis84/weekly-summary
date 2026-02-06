# Week in review — 2026-01-30 (Friday)

0:00 Hey everybody, this is my weekly video. I just wanted to go through what I worked on this week and where we kind of netted out.
0:07 First thing I'll call out, I do have 5 PRs that are not merged yet. One of them is approved, it's just in the middle of the stack.
0:16 I don't want to merge that, I'm just going to leave it until the stack is ready to go. Two of these are cluster-related auth PRs.
0:24 That are relatively small, most of the code change actually is in testing coverage for some of the changes that I'm making there.
0:34 The changes are really small, like one or two lines. I do want to merge those on a Friday. They're also not approved yet, but they're something that me and Vincent have talked pretty extensively about at this point.
0:46 So, finally, this offload is very close to being approved and merged, but I'm not going to demo it this week.
0:55 I want to save it till next week. It's really cool. It's a lot of great improvements there to the flow, working off the design stuff that Conrad sent my way from Figma.
1:05 So, all right, let's do a quick demo. Oh wait, before I do the demo, stats, because I've been doing this.
1:12 Uh, this week is a little bit less on PRs merged and, and PRs created compared to previous weeks. Um, as to be expected, um, I've been working pretty dang hard on and getting improvements to performance across web giving flow, um, which has meant a lot of debugging, a lot of time spent in Sentry, um,
1:35 and adding a lot of logs and stuff there so that I can, uh, so that I can actually like fix the things that need to be fixed, um, with regards to performance.
1:44 So, um, not a ton of, uh, PRs to like track that work. So that's why these numbers are lower this week than, um, previous weeks.
1:53 Um, PRs merged, or sorry, PRs in review, pretty, I would say an average week for me. Um, and eventually we're going to have enough data here that we'll be able to see like what is Nathan's average number of PRs that he reviews in a week.
2:07 Um, we don't have enough data yet for me to pull that and I'm not going to go historically before Jan 1st because I don't really want to.
2:15 So, um, as far as linear issues completed or worked on, also lower this week. Um, I did not really get into fixes and improvements.
2:24 Um, like the, the small, uh, QA bugs that we found, we've, uh, added quite a few to the project, but I'm not really working on those this week, um, because I've been working on performance stuff.
2:36 So, uh, that's what I got on that. Let's go ahead and jump into a little demo. So where we were at the end of last week was this.
2:44 All right, so first off, you will notice that I loaded the this page in. I didn't load it in, but I loaded it in before the video started and, uh, recurring did not automatically open.
2:55 Um, that's because we were not respecting a certain value, uh, that's in the config database. So, um, I made that better.
3:05 Uh, and I'm right now, again, I'm, I'm showing you what this looks like currently, uh, as of one week ago.
3:13 Uh, all right, so here we go. So you can kind of see we had some loading here, and I'm going to show you how I've been debugging this, because this is what my life has been for the last week.
3:26 So I'm sitting here, refreshing this page, and I'm looking at this component specifically, the Stripe UI component, um, and just trying to see, you if I can get this number to be much lower, um, so you can see, you know, .80, .68, .72, so around .94, so, um, almost a second, uh, on the, on the LCP here
3:54 , um, and I'm going to switch now over to latest branch as of today. Give this a quick refresh.
4:10 Now, you saw some, like, different loading state there. I'm going to keep doing this a couple times so you can see what's going on here, um, and as well as improving this dramatically, like, nearly way.
4:25 Maybe four times faster, three to four times faster, um, and also did a lot of work on the, uh, layout shift and making sure that, um, I was getting that number as low as possible.
4:39 Um, so, there you go. So, like, that's, like, definitive proof of, like, some improvements that I've been making to the Contentful paint of, uh, of the Giving Flow on web.
4:54 So, um, other things I, I did call out that I went through this page right here, and you can see on a first load of this, uh, you're going to see this recurring open, and that's because we are now respecting this correctly.
5:10 We're actually respecting it here as well. Um, we were doing this, but we were not doing this. So, now when I refresh, I have no params, and if a church has, uh, a default frequency, then, uh, this drawer will open.
5:24 So, this toggle will be automatically on, and the frequency will be automatically set. Um, that's what I got. Sorry if somebody was ringing my doorbell.
5:33 Hopefully they didn't make it in the recording. Um, but, if you got any questions, let me know, and if not, I'll see you next week.
5:39 Bye.