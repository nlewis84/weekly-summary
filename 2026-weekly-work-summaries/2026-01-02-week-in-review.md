# Week in review — 2026-01-02 (Friday)

0:00 Hey, how's it going everybody? I just wanted to go through quickly what I went, worked on today and also what my plan is for the week so we can kind of have that in our mind, uhm, moving forward.
0:11 Okay, so first off, today I worked, uhm, solely on the sign-in and sign-up pages, uhm, inside of web, uhm, to get this closer to, uhm, parity with our, uhm, Figma mocks that Siobhan has been working on.
0:28 So, uhm, let's just look at what all's changed. So, like, this text is slightly smaller. It's also centered. It's also changed.
0:36 All of this text is completely different. Uhm, this is a different component now. So, this is going to be using a, actually, not a different component.
0:45 It was still a tabs component previously. It's using a new very variant of that component though. Uh, so, I called it the, uhm, the inverted variant.
0:53 So, instead of a grey background with a white button, it's, uhm, a white background with a grey button. Uhm, added some icons on here.
1:03 Uh, also, this field set, uhm, uh, component here, there was a hierarchy issue with this, uhm, labeled here was in black or white based on light mode or dark mode.
1:17 And, because of that, like, it, uhm, there, it was, there was a hierarchy issue. So, I, I made it a secondary color.
1:24 This is like a grey here, uhm, which helps to get, uhm, get this information out of the way. Like, because it's helper text, it's labeled text, it's not, it shouldn't draw the user's eye to it as much as it was previously.
1:36 So, this is just a little bit nicer. Okay, we also got, uhm, a new placeholder here for phone and a new placeholder here for email.
1:45 Uhm, I'll come back to this button in just a second. This text is slightly smaller, it's also completely different, and it says sign up without an arrow.
1:52 Previously, I believe it said log in with an arrow or sign up, so all this stuff was slightly different. So, uhm, that's what we got here.
2:00 Okay, and then, this button, some cool stuff here. It is a grey system color right now, and that is because right now if you try to submit it, it wouldn't do anything.
2:12 So, what I've got it doing now is when you hit this button, it focuses the input that you're working with.
2:18 That way a user knows, oh, I need to put my phone number in. Also, whenever a user starts to type their phone number in, you're going to see it start to change colors.
2:27 And also, the phone number is going to auto-format into a phone number. So, you're going to see those parentheses and that hyphen in the space.
2:34 I didn't type those, like, it's just learning that, like, it knows that this is a phone number input, and we should format it like a phone number.
2:41 Okay, so that's the way this works. Uhm, this button is now active. I can hit it, and it works. Uhm, also, of note, there is one other version of this auth screen that exists at a, at a, uhm, a, outside of the church context.
2:59 Uhm, so, I needed to make sure that this worked exactly the same as those two screens that I just showed you, which this does.
3:06 So, you come here, and you can see all the same functionality here between the two phones. Uhm, also, you will notice, uhm, oh, you know what?
3:17 This is a good time for me to show this. Let's go ahead and do dark mode. So, you can see dark mode here.
3:26 And you take this out. There you go. Dark mode. And I'm going to come back over here to the church-specific version.
3:37 And there you go. You can see it. Okay, uhm, okay, so that's what I worked on today. Uhm, what I've got planned on to work on for the rest of the week is I'm planning on working on the following screens.
3:51 The OTP Verify screen, which is the very next screen, has already got a PR open, uhm, and in review. So, that should get merged soon.
4:00 I don't know. Anyway. It's, it's an easy PR to look at and approve. So, uhm, that'll be next. There's one little link at the bottom that says something like, change my phone number, change my email.
4:12 I've got to add that. Uhm, I wanted to do that in a separate PR because that is going to be a little bit more of a lift than that PR.
4:19 I wanted that PR to be separate. The one that I have now is really small, uhm, super easy to review.
4:25 That one's going to be a little bit more once I had that link. So, uhm, that will be a quick one that I'll work on probably tomorrow.
4:32 The next thing I'll work on is the, uh, other payment methods page. I think that's what we call it. So other payment methods page is got some, a lot of styling issues.
4:44 Uhm, we're using a secondary color and a primary color, uhm, theme. Throughout and like it's, there's no consistency to how we're using it and we should just be using secondary on all on that form and all of the spots.
4:58 So I'm going to do that next. Um, there's also several, uh, linear issues for quality of life improvements to that stuff.
5:04 Like make sure that if we have a person's phone number or email or name that we pre-populate fields with, uh, that so that form you can, as a user, you could advance through it really quickly, um, to move on to the next steps.
5:18 Um, and then finally there is a thank you page after someone gives, um, and that's got some really small, um, tweaks to it, to like, adjust the styling similar to what I've worked on today, but, um, less, much less because it's just text.
5:35 So that'll be, I think, like one icon, I think it's got like a check mark on it. So like, besides that, like it's really straightforward.
5:42 I think most of my time this week, which is only Tuesday and Friday, um, I will be spending mostly on that update payment methods page.
5:49 Um, because like, again, like there's just a lot of, there's a lot of styling stuff that needs to be cleaned up.
5:55 So that's what I got working on for this week. Um, hope you enjoyed. This is, uh, this, is a completely new, um, the experience on the login, which I'm excited about.
6:05 Like, you know, it looks really, really nice. So, all right, that's what I got. Talk to you later. Bye.

---

0:00 Hey everybody, just wanted to run through the stuff that I worked on for today. I'm probably going to forget stuff because I worked on a ton of things.
0:08 I'm going to try to hit this out in one try. So if I miss something, I'll drop it in the comments.
0:14 Okay, so getting started here. A lot of today was running back and forth on checking the merge flow. so what you're seeing here is I'm setting some Apalis user, uh, to true for things that, for users that I've already got set up.
0:32 Uhm, yeah, so let's go through login. So I just invalidated, actually I didn't invalidate, I just set Apalis user to false, uhm, for some users that I already had in the database.
0:45 So I'm going to attempt to sign in with this. It should say, you know, you don't have one. I'm going to go ahead and sign up.
0:50 I'm using this account. Uhm, small refactoring on this page. You now have a white background on the OTP inputs. I missed this yesterday, uhm, but I had noticed it this morning.
1:02 Also, uhm, based on the Figma mocks, these inputs should be slightly rectangular in desktop and in, uh, mobile view they're square.
1:14 Uhm, I don't think there was any light mode changes on this page. I'm just going to flip it just real quick just to see.
1:21 Okay. So, uhm, I left this as, as a black, uhm, background because I think that that looks just fine. Uhm, yeah, a small minor change.
1:32 Like I, this icon was like the wrong size, so I made it the right size. All right. So let's keep going.
1:37 Uhm, I'm going to note that resend, you cannot spam this any longer, uh, when you hit it, you now get a timer, uhm, so that people can just spam this.
1:50 That was a separate issue. Uhm, okay. So on the merge page now, uhm, this page has been significantly revamped, uhm, and I don't have a ton of users here, uhm, but just know, like, I did test this with, like, a list of ten different users' profiles that we were trying to merge against, uhm, so basically
2:14 right now you can see that this, uh, this button here is, uhm, it's not disabled, but, like, it's not, it's not, like, the secondary color, uhm, and it's telling the user.
2:24 Just select a profile, uhm, and as you select a profile, you can see, like, that we, instead of having radio buttons like we had before, uh, now you have, like, these cards, uh, if you'd saw multiple cards, like, some of them would have that, uhm, that white background, and then the one that I selected
2:42 would be orange, the name is going to also highlight with that secondary, and also the button is going to switch out over to the correct color, and, again, this is working inside of, uhm, light and dark mode also, uhm, so you've got styling for all of that, and you've also got the, the mobile view of
3:02 this as well, uh, I, I built a mobile first, so I built all the stuff based on the Figma mocks in mobile first, and then, uhm, and then made sure that it, look good also in desktop view.
3:15 Okay, so from here, uh, you can select, uh, an account, or you can skip the step. The skip the step is not actually skipping, it's actually just creating a user account, uhm, so, I'm gonna go ahead and do this, uhm, some loading state here, because it does take just a second.
3:31 Now, on this page, this is completely revamped as well, uhm, so on this page, uh, instead of everything beyond my car.
3:37 We're kind of moving away from that sort of style, uhm, so everything's just laying straight on the page, uhm, first and last name are, uh, in desktop view next to each other on the same row, and then, if you look in mobile view, then they just stack, uhm, vertically, which is cool, uhm, again, the button
3:58 is not activated, uhm, until you start to fill this out, and if I try to, I can't do anything, so I'm going to come here, uhm, I think there's going to be a small improvement there, that whenever I click it, if, uh, instead of it being disabled, that it actually highlights the field that needs to be 
4:13 filled in, uhm, so that'll be something, I'll capture that as an issue, I just noticed that just now, so thanks for helping me find that, uhm, so I hit continue here, and, again, this is all, I don't I'm not gonna flip between light and dark, but it's working in light and dark mode.
4:28 Alright, now I'm gonna go to the git page, uhm, so, I haven't done anything yet, really, I've done a couple of things, I take it back, I've done a couple of things on this page, uhm, but mostly it's in service of getting to the next page, because that's what I worked on next, uhm, so, uh, Now once we
4:47 get here, that previous page, is correctly sending user information if the user is logged in on the web, sometimes they're not, and that's okay, usually the slash give route is going to be an unauth giving route, and we have this other, uhm, auth giving route, uhm, so you can see it's auth, I've got 
5:08 my name here, that's, and this is like kind of a feature flag thing, but it's there, uhm, but, but, uh, I wanted to make sure that I called off that, like, I worked on both of those routes, so, this give route, uh, if a user is logged in, they will be able to pass along their user information, which 
5:24 you can see, uh, right here, this full name is auto-populated, as is the email address, I haven't given a phone number yet for this account, so it's blank, uhm, same thing here, this button is, uh, doesn't exist, it doesn't it doesn't submit anything, because the form is not filled out, so, I hit it,
5:42 and you can see that behavior that I just talked about a second ago on the other form, it highlights the phone number, focuses it, so I can go, ok, I need to enter some information here, ok, uhm, and it's still not active, because we still haven't finished this, so I have to go through all this, if you
5:58 want to see a, uhm, a gif, of, of me doing this, like, go check out GitHub, I, I've got one in a PR that, that demonstrates me going through this slow, uhm, but, there's, uhm, so once you go through this, it will fill out, and this, uh, this button will turn to the orange color, meaning you can actually
6:17 hit it, and go on to the next screen, ok, now that's the bulk of what I worked on today, uhm, I did, you can see, also, So, uhm, I didn't call it out, but, like, this styling on this page is, is greatly different, like, this little summary block is completely different, uhm, I did change a lot of styling
6:35 on the donation embed, uhm, package, uhm, and then I also, you know what, I can just pull it up real quick, just to show it, uhm, I had to make sure that this didn't break anything in admin, uhm, because I knew that we were using this in, uhm, embed here as well, uhm, so if you come over to this, I just
6:54 had to make sure that everything on this page worked just fine, and it's this one right here, so you can see, like, we got some theme that's coming through correctly, uhm, this theme is coming here also, this one also right there, and then this button is also, actually has the same behavior here, uh,
7:12 as what we were seeing on web. So, that's what I worked on, uhm, the next thing will be, uh, for me to go back to this page, and kind of revamp this based on what we've got, uhm, in the Figma mocks, and then finally move on to the page after, uh, after this one, which is, like, the thank you page, uhm
7:32 , install that, uhm, to get that going, uhm, plan on knocking out both of those on here, and Friday, uhm, that's what I got, so it's been a great day of work, uhm, and I will catch y'all later, bye.
