# LeetCode Review Reminder

A VS Code extension that helps you manage and track your LeetCode problem review schedule.

## Features

- Automatically tracks review schedules from LeetCode Plugin Repository (LCPR)
- Generates a daily review list in Markdown format
- Shows notifications for due and overdue problems
- Supports checking off completed reviews
- Carries over unfinished reviews to the next check

## Requirements

- VS Code 1.97.0 or higher
- LeetCode Plugin Repository (LCPR) workspace setup

## Installation

1. Install through VS Code Marketplace
2. Ensure your workspace has `.lcpr_data/bricks.json` from LCPR

## Usage

1. Run `Check LeetCode Reviews` command (Ctrl+Shift+P / Cmd+Shift+P)
2. Review your [TODAY_REVIEW.md](TODAY_REVIEW.md) file
3. Mark completed reviews by changing `[ ]` to `[x]`
4. Run the command again to update progress

### Sample Review List

```markdown
# 📚 LeetCode Review List
> Generated on Friday, February 21, 2025

## 📊 Status
- Total problems: **11**
- Overdue: **9**
- Today: **2**

## ⏰ Overdue Problems
_These problems are overdue and should be reviewed as soon as possible_

- [ ] 21.Merge Two Sorted Lists.py ⚠️
- [ ] 23.Merge k Sorted Lists.py ⚠️

## 📅 Today's Problems
_Problems scheduled for review today_

- [ ] 264.Ugly Number II.py

---
### 📝 Instructions
- Mark a problem as reviewed by changing `[ ]` to `[x]`
- Run the command again to update progress (command can be triggered either manually or during VSCode startup)
- Unfinished problems will be carried over to next check
```

## Known Issues

## Release Notes
Initial release

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
