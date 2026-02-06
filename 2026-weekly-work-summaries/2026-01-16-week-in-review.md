# Week in review — 2026-01-16 (Friday)

0:00 What's up, this is my weekly video for what I worked on. So, first off, let me demo a bunch of stuff, and I'm not showing my video because I wanted to work on my big screen, uhm, so you don't have to look at the side of my head.
0:10 Alright, so, on this one, I am looking at the code as it was on Sunday before I started working on Monday of this week, uhm, so I'm going to show all that stuff.
0:18 This is the old slash give route. If I go to slash new give, it doesn't even exist. This is not, this is a, a thought in my head at this point.
0:28 This is not even a code thing at this point. It was not even, uhm, in draft form at this point.
0:33 So, uhm, we got slash give, uhm, you can see as I'm working through this, we've got, this is the old route.
0:39 Old donation embed code, uhm, get some issues with this give button still. Uhm, and I'm not going to call out everything that's different or, uhm, had issues.
0:48 Uhm, just want to kind of like click through it so you can kind of see the things that are going to be drastically different.
0:53 Uhm, a lot of focus, uh, focus, ring issues, as you can see here, uhm, defaults here. Uh, and I'm going to, uh, missing number sign, dollar sign, uh, mobile view also, a little bit strange.
1:11 It's, it's a little bit more padding on the side, I would say. Not necessarily strange, just different. Uhm, okay, and then I'm going to show some dark mode also.
1:19 Uhm, you can see also too, these are full width instead of, they'll be half width later. Uhm, some spacing up at the top.
1:26 Bye. Hit this button, and am I logged in? I must have already logged in. Uhm, so there was, uh, not too bad of a flash there as we loaded into this.
1:36 Uhm, but if I were logged out, it would be a little bit more severe. Uhm, language here is incorrect. Uhm, I'm not going to do any of the rest of this because the rest of this mostly stays the same.
1:51 So, uh, so this is this form, uhm, and, yeah, like I said, NewGives doesn't even exist. So, alright, now I'm going to go back and switch over to main, and so this is where we are, where we're standing right now.
2:08 This is not even with all the changes that I have, uhm, locally. Uhm, and I think I'm going to have to pause real quick here and update some things in my code, and I don't want you to see it because it's kind of silly, uhm, but based on some session issues that we had previously, uhm, this is not, I 
2:30 have to, I have to recalculate, not recalculate, uh, I don't know what the word is right now, I need to do something with my, uh, generated GraphQL so that it works correctly, so I'll be right back.
2:39 Okay, I'm back, uhm, actually, I think that there may be, like, a TypeScript issue also on slash history that was causing this, uhm, I don't know if it's actually affecting anybody, uh, or if maybe it's just, like, a bork state because I went back to something a week ago.
3:00 Okay, so, anyways, alright, here we go, so we're on the new flow, uhm, if I go to slash new give right now, it doesn't exist, uh, and that's because I did all my work, basically, in this, uh, route, and all of it got merged into slash give, so now we're on this, uhm, I'm in dark mode, we've got a new
3:19 money input, uhm, we've got, this is mostly the same, uh, but this is different, and you can see we've got some better focus rings here, we're now opening the most.
3:28 little for this, uhm, we've got a default of weekly, there's a PR out right now that sets this default to be monthly, eventually we're going to get rid of select this frequency, uhm, this background of this is going to be different in dark mode, in light mode it actually looks great.
3:45 So, we're looking in dark mode, here's in light mode, can't even tell there's a difference, So just a small color tweak on that.
3:51 I'm going to hit this, monthly today, doing fine. Okay, so I'll give, I'll put an amount, oh you can see that, that's pretty cool.
3:58 So we've got the shake here, that's what Vinted's doing, I love it, because we had an issue that we found, there was, you, uhm, the money input needs a physical interaction with it in order for the keyboard to show up on a mobile device, uhm, it's called a trusted event, I learned about it, I didn't 
4:14 know about it before this week. Uhm, so, to get around that, we added this UI, which Vinted and I had the awesome idea of shaking the input, which we do.
4:23 Okay, uhm, PR out now to add a dollar sign on this as appropriate. And, there was no weird loading states at all between when that page went away and this page loaded, thanks to the beautifulness of Remix.
4:40 And, our loaders, uhm, we still have some loading of this Stripe component that has to occur client-side, which is not the greatest.
4:47 Uhm, and I'm going to do some experimenting and also some just digging to see if we can get any server-side rendered components for Stripe for this.
4:55 If not, no big deal, we can just roll with it. Uhm, and it's a lot better UX, I think, uhm, as far as loading states go, which was one of my primary tasks for this week.
5:05 Okay, so we're on this form, uhm, and I'm filling it out, uhm, and you can see down here, uh, this language is not exactly correct, there's a PR that's out that will fix this.
5:17 Uhm, can I switch to it real quick? Maybe. Uhm, I can. Okay, select payment method, so I'm on the different branch now, and if I take this off and delete this, it's gonna say enter your email, which is super useful.
5:33 Okay, so we're here, I'm gonna do this, do my card, and give money, and the dollar sign's there now. If I go back to the other page, the dollar sign will still, will be there, so, uhm, yeah, so that's where we are for this week, uhm, this is a, uh, a, a, obviously a huge undertaking, uhm, but, uhm, I
5:56 think we're in a really good place with this now where we netted out, which is awesome, uhm, next week will be up to, uh, clearing out the large backlog of QA items that I've already detailed on, uh, Linear, you can see them if you head to the WebGiving project, you can see this queue, I am sorted them
6:14 by priority based on my QA, gut reaction to them, uhm, so if somebody wants to come in and readjust these, feel free, uhm, but these are what I'm working on, and then obviously as I'm going through this, I'm still testing, uh, all of this flow as a user to make sure that there's nothing that catches 
6:32 me off guard, there's nothing that's unexpected in how it, uh, how it acts, uhm, basically just going through product validation for this to make sure that we're doing what we're building is actually, uhm, something that as a user makes sense, uh, and does what I expect it to do.
6:47 So that's what I'm working on next week, uh, even though it's going to be a short week, I expect to, to make, uhm, solid progress again on this, uhm, and net out at the end of next week in just as much of a completely different spot than where we did on, uh, where we ended this week.
7:04 So that's what I got for this week. I'll catch you later. Have a nice long weekend. Bye.