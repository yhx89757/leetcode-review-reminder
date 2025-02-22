// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from './config';

interface BrickData {
	review_day: number[];
	[key: string]: any;
}

interface BrickFile {
	all_bricks: { [key: string]: BrickData };
}

function getLocalDayBoundary(): { startOfDay: number, endOfDay: number } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	return {
		startOfDay: Math.floor(start.getTime() / 1000),
		endOfDay: Math.floor(end.getTime() / 1000)
	};
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('LeetCode Review Reminder is now active!');

	// Run check once on startup
	checkReviews().catch(error => {
		vscode.window.showErrorMessage(`Initial review check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	});

	// Register command for manual checks
	const disposable = vscode.commands.registerCommand('leetcode-review-reminder.checkReviews', () => {
		checkReviews().catch(error => {
			vscode.window.showErrorMessage(`Review check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		});
	});

	context.subscriptions.push(disposable);
}

const getWorkspaceRoot = (): string => {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		throw new Error('No workspace folder found');
	}
	return folders[0].uri.fsPath;
};

const checkReviews = async () => {
	try {
		const config = getConfig();
		const workspaceRoot = getWorkspaceRoot();
		const reviewFile = path.join(workspaceRoot, config.reviewFilePath);
		const bricksPath = path.join(workspaceRoot, '.lcpr_data/bricks.json');

		if (!fs.existsSync(bricksPath)) {
			throw new Error('bricks.json not found!');
		}

		// First process any checked items if review file exists
		if (fs.existsSync(reviewFile)) {
			const { checked } = await parseReviewFile(reviewFile);
			if (checked.length > 0) {
				await updateBricksJson(checked, bricksPath);
				vscode.window.showInformationMessage(
					`✅ Processed ${checked.length} completed reviews`
				);
			}
		}

		// Then generate new review list
		const data: BrickFile = JSON.parse(fs.readFileSync(bricksPath, 'utf-8'));
		const { endOfDay } = getLocalDayBoundary();

		// Find all overdue and today's reviews
		const dueProblems: string[] = [];
		Object.entries(data.all_bricks).forEach(([id, brick]) => {
			const overdueDays = brick.review_day.filter(day => day <= endOfDay);
			if (overdueDays.length > 0) {
				dueProblems.push(id);
			}
		});

		const filePromises = dueProblems.map(async (id) => {
			const patterns = config.supportedExtensions.map(ext =>
				new vscode.RelativePattern(
					workspaceRoot,
					`**/${id}.[!.]*${ext}`
				)
			);
			const files = await Promise.all(
				patterns.map(pattern => vscode.workspace.findFiles(pattern, '**/node_modules/**'))
			);
			const allFiles = files.flat();
			return allFiles[0]?.fsPath.split(path.sep).pop() || `Problem ${id}`;
		});

		const files = await Promise.all(filePromises);
		const uniqueFiles = Array.from(new Set(files));

		await updateReviewFile(uniqueFiles, reviewFile);
		await showNotification(uniqueFiles, reviewFile);
	} catch (error) {
		vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

const updateReviewFile = async (files: string[], filePath: string) => {
	try {
		const date = new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		// Get current timestamp for checking overdue status
		const { startOfDay } = getLocalDayBoundary();
		const data: BrickFile = JSON.parse(fs.readFileSync(path.join(path.dirname(filePath), '.lcpr_data/bricks.json'), 'utf-8'));

		// Categorize problems
		const categorized = files.reduce((acc: { overdue: string[], today: string[] }, file) => {
			const id = file.split('.')[0];
			const brick = data.all_bricks[id];
			if (brick && brick.review_day.some(day => day < startOfDay)) {
				acc.overdue.push(file);
			} else {
				acc.today.push(file);
			}
			return acc;
		}, { overdue: [], today: [] });

		const content = [
			'# 📚 LeetCode Review List',
			`> Generated on ${date}\n`,
			'## 📊 Status',
			`- Total problems: **${files.length}**`,
			`- Overdue: **${categorized.overdue.length}**`,
			`- Today: **${categorized.today.length}**\n`,
			'## ⏰ Overdue Problems',
			'_These problems are overdue and should be reviewed as soon as possible_\n',
			...categorized.overdue.map(f => `- [ ] ${f} ⚠️`),
			'\n## 📅 Today\'s Problems',
			'_Problems scheduled for review today_\n',
			...categorized.today.map(f => `- [ ] ${f}`),
			'\n---',
			'### 📝 Instructions',
			'- Mark a problem as reviewed by changing `[ ]` to `[x]`',
			'- Run the command again to update progress (command can be triggered either manually or during VSCode startup)',
			'- Unfinished problems will be carried over to next check',
			'\n> _Generated by LeetCode Review Reminder_'
		].join('\n');

		await fs.promises.writeFile(filePath, content);
	} catch (error) {
		throw new Error(`Failed to update review file: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

const showNotification = (files: string[], filePath: string) => {
	if (files.length === 0) return;

	const total = files.length;
	vscode.window.showWarningMessage(
		`📚 ${total} LeetCode ${total > 1 ? 'problems' : 'problem'} need review!`,
		"Open Review List",
		"Remind Later"
	).then(choice => {
		if (choice === "Open Review List") {
			vscode.workspace.openTextDocument(filePath).then(doc => {
				vscode.window.showTextDocument(doc);
			});
		}
	});
};

const parseReviewFile = async (filePath: string): Promise<{ checked: string[]; unchecked: string[] }> => {
	try {
		const content = await fs.promises.readFile(filePath, 'utf-8');
		const lines = content.split('\n');
		const checked: string[] = [];
		const unchecked: string[] = [];

		lines.forEach(line => {
			if (line.startsWith('- [x]')) {
				checked.push(line.replace('- [x] ', '').trim());
			} else if (line.startsWith('- [ ]')) {
				unchecked.push(line.replace('- [ ] ', '').trim());
			}
		});

		return { checked, unchecked };
	} catch (error) {
		throw new Error(`Failed to parse review file: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

const updateBricksJson = async (checkedProblems: string[], bricksPath: string) => {
	try {
		const data: BrickFile = JSON.parse(await fs.promises.readFile(bricksPath, 'utf-8'));
		const { endOfDay } = getLocalDayBoundary();

		Object.entries(data.all_bricks).forEach(([id, brick]) => {
			if (checkedProblems.some(p => p.includes(id))) {
				brick.review_day = brick.review_day.filter(day => day > endOfDay);
			}
		});

		await fs.promises.writeFile(bricksPath, JSON.stringify(data, null, 4));
	} catch (error) {
		throw new Error(`Failed to update bricks.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

export function deactivate() { }
