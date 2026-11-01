---
title: The model never does the math
description: In my agent projects, every number comes from code, not the model. Here is how that works in a financial planner and a grant writer, and why it reaches further than arithmetic.
pubDate: 2026-11-01
tags: [Agents, Claude, Python]
---

What's the monthly payment on a $300,000 mortgage at 6% over 30 years? One reasonable-looking method gives $1,768.11. It's in the right range, it's to the cent, and it's wrong. The bank's figure is $1,798.65.

The difference comes from one detail: how you turn an annual rate into a monthly one. It's about $30 a month, nearly $11,000 over the life of the loan, and a reader has no way to spot it. A language model can make exactly this kind of mistake, with a confident explanation attached. That's why my [financial planner agent](https://github.com/darylalim/financial-planner-agent) follows one rule above all others: **the model never does the math.**

## The rule

I built the planner to learn how language models and agents handle math calculations. It reads your own bank and brokerage exports, projects savings and retirement scenarios, and compares ways to pay off debt. It runs on Claude, but every figure it reports comes from a tool, never from the model's own arithmetic. The system prompt states it plainly:

```text
Never calculate a financial figure yourself. Not compound growth, not
a loan payment, not a payoff timeline, not an inflation adjustment.
Always call the calculator tool. A number you produce by reasoning
will look plausible and be wrong, and the person reading it cannot
tell the difference.
```

The prompt asks; the code makes it work. Most of the math lives in [`finance.py`](https://github.com/darylalim/financial-planner-agent/blob/main/src/financial_planner/finance.py), a plain Python module with no LangChain imports, and every calculation in it is pinned by a test.

## Where the $30 a month goes

Here are the two functions behind the mortgage example (docstrings shortened). They convert an annual rate to a monthly one in two different ways, on purpose:

```python
def monthly_rate(annual_rate: float) -> float:
    """Convert an annual rate to its equivalent monthly compounding rate."""
    _check_rate("annual_rate", annual_rate)
    return (1.0 + annual_rate) ** (1.0 / 12.0) - 1.0


def apr_monthly_rate(apr: float) -> float:
    """Convert a quoted APR to a monthly rate the way lenders do: ``apr / 12``."""
    _check_rate("apr", apr)
    return apr / 12.0
```

Both are correct, for different things. An "expected 7% return" means 7% effective, so twelve monthly periods have to compound to exactly 7%. Dividing by 12 instead gives 7.23% a year, which overstates a 30-year projection. A loan's APR is different: US lenders quote it as a nominal rate compounded monthly, so dividing by 12 is exactly what the bank does. Use the investment formula on the mortgage and you get the $1,768.11 from the start of this post.

A model can know both conventions and still pick the wrong one in the middle of a long answer. A function can't. And a test makes sure it never drifts:

```python
def test_matches_standard_mortgage_payment(self):
    """$300k at 6% over 30y is $1,798.65/mo on any lender's calculator."""
    result = amortize_loan(principal=300_000, apr=0.06, years=30)
    assert result.monthly_payment == pytest.approx(1798.65, abs=0.01)
    assert result.months == 360
```

Some tests pin values anyone can check, like that mortgage payment. Others pin properties that must always hold: paying off the highest rate first (avalanche) never costs more interest than paying off the smallest balance first (snowball).

`_check_rate` is worth a mention too. It rejects any rate outside -100% to 100%, so if the model passes `7` when it means `0.07`, the tool returns an error instead of a projection at 700%.

## The rule reaches further than you'd think

Once every number has to come from a tool, a few less obvious things follow.

**Ratios count as math.** A savings rate or a category's share of income is a division, so the model can't do it either. The spending summary tool returns those ratios already, because the model can only follow the rule if a tool offers the number it needs.

**Tools have to match how people talk.** The retirement tool used to take only an annual withdrawal. People say "I'll spend $5,000 a month", so the model multiplied by 12 itself and quoted the result, a number no tool had produced. Now the tool accepts either and returns both.

**Summaries can break the rule.** In a long conversation, the agent replaces older turns with a summary. If the summary rounds or rewrites a figure, that figure comes back into the conversation with no tool behind it. So the planner uses its own summary prompt, which copies every amount, rate and date word for word, names the tool that produced each one, and never calculates.

## Beyond math: let the model judge, but make it show its evidence

The same idea works where the answer isn't arithmetic. My [grant writer agent](https://github.com/darylalim/grant-writer-agent) finds funding opportunities and scores how well each one fits an organization. A fit score is a judgement, not a calculation, so the model has to be involved. The question is which part it does.

I wrote grants at Pacific Gateway Center, a nonprofit in Honolulu, and the process was complex to coordinate, time-consuming and expensive. I built the grant writer to help nonprofits move through that work faster.

The model rates each opportunity on six criteria, from eligibility to timeline, and for each one it writes a block like this, with a single verdict word and exact quotes as evidence:

```text
## eligibility
- Verdict: STRONG
- Citation (opportunity): "<exact quote from the funding announcement>"
- Citation (org profile): "<exact quote from the organization's profile>"
```

That's all it writes. Each criterion has a weight in the code ([`opportunities.py`](https://github.com/darylalim/grant-writer-agent/blob/main/src/grant_writer/opportunities.py)): eligibility 20, mission alignment 25, program fit 20, track record 15, award size 10 and timeline 10. The weights add up to 100, so the total reads as a percentage, and they never appear in the prompt. The verdict decides what share of a criterion's weight it earns:

```python
_VERDICT_FRACTION: dict[str, tuple[int, int]] = {
    "STRONG": (1, 1),
    "MODERATE": (3, 5),
    "WEAK": (1, 5),
    "NONE": (0, 1),
}
```

So MODERATE on mission alignment earns 3/5 of 25, or 15 points. As the module's own notes put it, a made-up total isn't caught; it can't be written down at all, because the format has nowhere to put one.

Then the code checks the evidence. Every quote is looked up in the file it names, ignoring line wrapping, formatting and capitalization, and any quote that can't be found there is flagged. If a fact is unknown, the model writes `[NEEDS INPUT: <question>]` instead of inventing one.

## The pattern

Both agents split the work the same way:

- **The model** reads, decides which tool to call, judges with evidence, and explains the result in plain language.
- **The code** does anything a reader can't check by eye: numbers, scores, and whether a quote really appears in its source.
- **Tests** pin the code, so the rule holds after every change.

A prompt can ask a model not to do something. Code that gives it nowhere to do it is stronger, and that's the kind of guarantee I want before anyone makes a decision based on what an agent tells them.

If you're building an agent, list every number and judgement it will show a person, and ask where each one comes from. Anything a reader can't check by eye belongs in code, with a test behind it.

If you work at a nonprofit and grant writing takes more time than you have, I'd like to hear from you. Find me on [LinkedIn](https://www.linkedin.com/in/daryl-lim-862a815).
