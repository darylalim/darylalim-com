---
title: Why I build AI that runs on your own machine
description: Most of what I build runs entirely on a Mac, with no cloud and no telemetry. Here is why, what it costs, and when I use hosted models anyway.
pubDate: 2026-10-31
tags: [On-device AI, Privacy, MLX]
draft: true
---

<!--
  First draft, written from the project READMEs. Every [TODO: …] needs Daryl's
  own words; the build refuses to publish a post that still contains one.
  Before publishing: set pubDate to the publish date and remove `draft: true`.
-->

The line at the top of this site is that I build AI that runs on your own machine. Most of my projects are built that way: [granit](https://github.com/darylalim/granit) transcribes meetings, converts documents and answers questions with citations, and once the models are downloaded it makes no network requests at all.

[TODO: the moment or reason you started building this way. A specific story will carry this post better than the arguments below.]

## What "on your own machine" means

It means the model weights are downloaded once, from Hugging Face at pinned revisions, and after that your files never leave the Mac. On Apple Silicon, [MLX](https://github.com/ml-explore/mlx) makes this practical: a recent Mac has enough unified memory for everything granit uses, from a speech model and a document model to an 8B language model, embeddings, a reranker and a guard model.

## Why it matters

**Privacy becomes a property, not a promise.** A hosted service can promise not to keep your data. A program that never sends it doesn't need to promise anything, and you can check it for yourself. That difference matters most for the things people most want help with: recordings of meetings, medical notes, bank statements, contracts.

[TODO: which of these matters to you most, and why. The refugee casework and transcription jobs on the resume may be relevant, if you want to draw on them.]

**It works offline.** On a plane, in a hospital basement or on a bad connection, the tool behaves the same way.

**The limits are honest.** The model can't be quietly swapped, rate-limited or retired from under you. A pinned model gives the same kind of answer next year as it does today.

## What it costs

Local isn't free, and I'd rather say so up front.

- **Hardware.** granit needs an Apple Silicon Mac with 32 GB of memory. [Granite Document Intelligence](https://github.com/darylalim/granite-document-intelligence) fits in 16 GB, peaking at about 6.7 GB of model memory.
- **Disk and setup.** granit's model weights take about 30 GB. The first run is a long download.
- **Speed.** Granite Document Intelligence reads about 10 pages a minute on an M2 Pro. A hosted service would be faster.
- **Smaller models.** An 8B model on a laptop is not a frontier model in a data center. So the projects lean on structure instead of size: cited answers, and a guard model that checks each answer against its sources.

## When I use hosted models anyway

Not everything I build is local. My agent projects use Claude, and the [RAG pipeline](https://github.com/darylalim/rag-pipeline) uses Voyage AI, MongoDB Atlas and Claude, all hosted. The RAG pipeline's README opens with a list of exactly what leaves your machine and where it goes, and any project that sends data somewhere should say so as plainly. That's the point: the choice should be yours, and you can only make it if you know.

[TODO: how you decide between local and hosted for a new project.]

## What's next

[TODO: what you're building next, or what you'd like readers to try first.]
