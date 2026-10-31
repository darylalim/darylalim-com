---
title: Why I build AI that runs on your own machine
description: Much of what I build runs entirely on a Mac. Here is why, what it costs, and when I use hosted models anyway.
pubDate: 2026-10-31
tags: [On-device AI, Privacy, MLX]
---

It started while I was learning to build applications with models from Hugging Face. I came across [a paper comparing local inference on Apple Silicon](https://huggingface.co/papers/2511.05502), which benchmarked five runtimes on a Mac Studio: MLX, MLC-LLM, Ollama, llama.cpp and PyTorch MPS. MLX had the highest sustained generation throughput of the five, so I started experimenting with MLX models on my own Mac.

Two things kept me there. I didn't have to pay for hosted services or manage API keys, and my data stayed private.

Many of my projects are built that way now. [granit](https://github.com/darylalim/granit), for one, transcribes meetings, converts documents and answers questions with citations, and once the models are downloaded it makes no network requests at all.

## What "on your own machine" means

It means the model weights are downloaded once, from Hugging Face at pinned revisions, and after that your files never leave the Mac. On Apple Silicon, [MLX](https://github.com/ml-explore/mlx) makes this practical, and [mlx-vlm](https://github.com/Blaizzy/mlx-vlm), an open-source library from [Neywa Labs](https://neywalabs.ai/), does the same for vision models: a recent Mac has enough unified memory for everything granit uses, from a speech model and a document model to an 8B language model, embeddings, a reranker and a guard model.

## Why it matters

**Privacy becomes a property, not a promise.** A hosted service can promise not to keep your data. A program that never sends it doesn't need to promise anything, and you can check it for yourself. For me, it matters most in two places: recordings of private meetings, and work with sensitive and confidential documents. Those are the two things granit was built to handle.

**It works offline.** This one matters to me for a local reason. This year, severe weather and storms in Hawaii caused power and internet outages. A tool that depends on a cloud service stops the moment the connection drops; one that runs on the machine keeps working. I want to help local businesses with tools that solve their problems, and those tools should still work on the day the internet doesn't.

**It costs nothing per use.** Once a model is downloaded, running it a thousand times costs the same as running it once, so you can try things freely.

**The model stays the same.** It can't be quietly swapped, rate-limited or retired from under you. A pinned model gives the same kind of answer next year as it does today.

## What it costs

Local isn't free, though. The costs come up front, and they're real:

- **Hardware.** granit needs an Apple Silicon Mac with 32 GB of memory. [Granite Document Intelligence](https://github.com/darylalim/granite-document-intelligence) fits in 16 GB, peaking at about 6.7 GB of model memory.
- **Disk and setup.** granit's model weights take about 30 GB. The first run is a long download.
- **Speed.** Granite Document Intelligence reads about 10 pages a minute on an M2 Pro. A hosted service would be faster, and the paper that got me started reached the same conclusion: local runtimes on Apple Silicon still trail NVIDIA GPU systems such as vLLM, though they are becoming a real option for private inference.
- **Smaller models.** An 8B model on a Mac is not a frontier model in a data center. So granit leans on structure instead of size: cited answers, and a guard model that checks each answer against its sources.

## When I use hosted models anyway

I start local, and reach for a hosted model when a task needs a bigger one. My agent projects use Claude for that reason. Some projects use other hosted services too: the [RAG pipeline](https://github.com/darylalim/rag-pipeline) stores and searches documents in MongoDB Atlas, and [clinical transcription](https://github.com/darylalim/deepgram-clinical-transcription) runs on Deepgram. When a project sends data somewhere, its README should say exactly what leaves your machine and where it goes, the way the RAG pipeline's does. That's the point: the choice should be yours, and you can only make it if you know.

## What's next

Next, I want to build AI tools that work offline for businesses anywhere the connection can't be taken for granted, starting at home in Hawaii. They should keep running through the next outage and keep private data on the business's own machine.

If you run a business and have a problem you think a tool like this could solve, I'd like to hear about it. Find me on [LinkedIn](https://www.linkedin.com/in/daryl-lim-862a815).
