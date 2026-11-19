# Brief: What's my IP

## Dinis's words

Dinis, 2026-11-19 ~17:00 UTC, in the cells.b@AgentiCCells.dinis session:

> "my original idea was that in the past, I actually started exploring creating simple websites that would do one thing really well. And even now, for example, I wanted to find out like what, if I was coming from a particular broadband provider or not in my house, right? And I searched for what's my IP address, and of course I hit these websites that are full of tracking, full of stuff, and I just want something very simple, right? So I think now we finally have the opportunity to create those. So can you start a whole bunch of websites? And the ones I'm thinking first is, again, what's my IP address, what's my information, but also I think there's another one that you can put next to it, which is almost like, what am I leaking, or something like that, or what, and what everything, what is my fingerprint? [...] we can actually even maybe add an LLM element to it [...] there was this amazing page we did that had a ridiculous amount of stuff that we leak, right? From the browser, this and this and this. So basically I think it would be really cool, actually educational. And remember that now we can completely play, this is like, this should go on a sovereign website, right? Because there's no tracking, there's nothing we put in there [...] if you look at the tools.sgit.ai, and basically go to the repo, tools.sgraph.ai, and I think it's dev.tools.sgraph.ai. There's a crazy amount of tools that are ridiculously useful, including some of them like really good, video recorder, like lots and lots of utilities there that we built, and I think we now should publish each one of them as a separate website, and with documentation and information, all that stuff. So can you do an inventory? In fact, can you start by doing the tools website, and then we can add them one by one? Maybe we do a batch of 5 and take a look, and then we take it from there. But I think this is also good to bring some SEO traffic for us, but also to help people."

## What the site is for
Answer "what is my IP address?" and "which network or broadband provider am I coming from?" in one quiet page, the way Dinis wanted it when he searched and found only pages full of tracking.

## Points to settle in the build
- A static page cannot see the visitor's public IP by itself: some server has to echo it back. Write down the options (a named public echo service with its privacy terms quoted, or our own small endpoint, which would need infrastructure and Dinis's word) and put the choice to Dinis before shipping a third-party call. Whatever is called is named on the page, with exactly what it is sent.
- The provider (ASN and organisation) needs a lookup too: same rule.
- The browser-side facts (IPv4 or IPv6, time zone, language) need no server.
- Sits next to what-am-i-leaking.agenticcells.site and links to it.

## Rules for every site in this family
- One thing, done well. No tracking, no analytics, no third-party scripts, no cookies, no ads. Say so on the page, and make it true: a visitor can check it in the browser's network panel.
- Everything runs in the visitor's browser. Nothing the visitor enters or drops leaves their device, unless the page says plainly where it goes and why, before it goes.
- Plain British English, no em dashes, no hype words. Invent nothing a visitor could take for real; every claim sourced.
- Documentation on the site itself: what it does, how it works, its limits, and how to check the no-tracking claim.
- Name no person but Dinis without their agreement.
