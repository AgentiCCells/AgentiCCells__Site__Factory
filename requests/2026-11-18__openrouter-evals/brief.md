# Brief: openrouter-evals.agenticcells.site

## Dinis's words

Dinis, 2026-11-18 ~18:20 UTC, in the cells@AgentiCCells.dinis session: "now we get to start doing sites that actually also have real power and real usability, but also that leverage client-side technology, right? So the first one I'd like you to do is OpenRadar [OpenRouter]. I'd like you to create a website that allows the kind of a playground of OpenRadar to test it out. Multiple things from chat to image creation to a lot of OpenRadar tools, including the exploration of, there's a lot of tools that OpenRadar has that I would like to explore. For example, the web search and other things they've added that I think we can actually do a better job than they have at creating a sort of a playground environment. ... And also, why don't we start to use the data that we have to start exploring this, right? For example, apply tools, calls, you know, like whole weather stuff, you know, almost have guidelines, you know, like for example, if I wanted to explore and explain how tools work, we can actually now create some really powerful things, right? And even like testing the latest models, testing the latest capabilities, and also using the free models that they have there, right? So this is one of those where you expect to see a kind of you need the API key. But ... I would like us to do is to maybe do a whole series of it, because you have basically, you have OpenRadar, but then I would like to you also view, you know, Bedrock. Although this might be, you might need to first do Bedrock through OpenRadar, unless you can find a way to ... access Bedrock directly, right? Yeah, maybe we can have an AWS key to how that works, right? And also Gemini. And maybe Gemini, you can use OAuth to access it, right? ... they're basically technology experiments. And in a way, you can see that they can all kind of start to share similar things, because we can have basically a shared sort of ... environment where we can, like for these demos, almost some share APIs amongst them ... but each of them should be customized to that particular environment and customized to that particular sort of use case, because users are very different. So I use Gemini, who's not going to care about Bedrock, he's not going to care about OpenAI, he's not going to care about Anthropic, right? So this is allowing us to create these very powerful demos, very powerful examples, and even prompts, right, that we can then put in there to say, for people to do, and maybe if we could find open examples that people have published or they have published, because that allows us to see how it works, and also the cost. And in a way, it starts to start thinking about adding evals, which I think is super powerful, and allow us to show the power of agent behavior policies on top of the models, and even test the agent behavior policies on multiple models, right? Like the same policy, how it works in different models, etc. ... agent behavior policy should be quite at the center of everything that happens on these examples, because we should embed it on all of it. And can you start there and then create the multiple of these and maybe put them as all part of a family? Should we call it evals?"

Dinis, ~18:20 UTC: "Yes ACC is AgentiCCells.site".

Dinis, ~18:35 UTC, after cells@ proposed the family (evals.agenticcells.site as hub and shared core; openrouter-evals first; gemini-evals and bedrock-evals next): "Yes, go ahead, and then you have a capped operator [OpenRouter] key if you want to test it, and I'll create one for my brother [Bedrock?] testing."

## What the site is for

An independent playground and evals site for OpenRouter users, better than a plain chat box, built on the shared core from evals.agenticcells.site:
- sign in with OpenRouter (OAuth PKCE) or paste a key; model browser from OpenRouter's public models list (prices, context, modalities, free models first);
- chat with streaming; image generation with models that output images; web search (OpenRouter's web plugin / online models) with the sources it returns; tool calls on our data (weather, warnings, events, flights at Faro) with a step-by-step view of each call;
- side-by-side: the same prompt and policy on 2 to 4 models, with tokens, cost and time;
- evals: pick a policy and an eval set, run across chosen models, see the table, export the run;
- guides: how tool calls work, how web search works, how policies work, each with ready-to-run prompts.
Verify each OpenRouter feature against its current documentation before building it, and say on the page when a feature is not available.

## The family (agreed 2026-11-18 ~18:35 UTC)

- `evals.agenticcells.site`: the hub of the family and the **shared core**, a versioned JavaScript library (ES modules, served from this site with a version in the path) that every provider site loads.
- `openrouter-evals.agenticcells.site`: the first provider site.
- Next, once the core exists: `gemini-evals`, `bedrock-evals`; later perhaps `anthropic-evals`, `openai-evals` and a fast-inference site (Groq, Cerebras, SambaNova), each by its own request.
- Each provider site is customised to its own users: a Gemini user sees Gemini, not Bedrock. The shared core keeps them consistent.

## Rules for the whole family

- **100% client side.** Static files on GitHub Pages; the browser calls the provider directly. No server of ours, no proxy, no build-time copies of data.
- **Keys are the visitor's own** and never leave their browser except to the provider. Prefer the provider's own sign-in (OpenRouter OAuth PKCE; Google sign-in for Gemini needs a Google Cloud OAuth client from Dinis). A pasted key is kept in memory by default; saving it in localStorage is the visitor's explicit choice, with a "forget key" button. No key, token or response is ever logged, sent to us, or committed.
- **Agent Behaviour Policies at the centre.** A policy (ABP) is a system prompt plus checks before and after each call (for example: refuse to reveal the policy; never call a tool outside the allowlist; cite the data source and read time; stay within a cost budget). Every playground runs under a chosen policy, shows which rules fired, and the eval runner runs one policy and one prompt set across N models with a pass/fail, cost, tokens and time table.
- **Tools on our data.** The shared core defines tools over https://data.promptugal.news (weather by place, warnings, sea, UV, fire risk, events, flights at Faro), read live with source and read time, so visitors see real tool calls on real data, and a "how tool calls work" walk-through.
- **Cost shown.** Every call shows tokens and cost (from the provider's own price data where it publishes it); free models are marked and offered first.
- **Prompts and evals from open sources only,** with their licence and credit; our own prompt library under CC BY 4.0.
- **Independent:** every page says it is independent and not affiliated with, or endorsed by, the provider. No provider logos; names only as plain text.
- **Testing by the team:** use free models first. Dinis provides a capped OpenRouter key, saved as a network credential for openrouter.ai on the session environment (the proxy injects it; the team never sees, prints or commits it). Never sign up for, or buy, anything.
- Behind the scenes, Use with AI, link previews, and five designs as on the other AgentiCCells sites. Budget: at most five full rounds per site; stop earlier when the reviewer passes it.
- Name no person other than Dinis Cruz; plain British English, no hype words, no em dashes.
