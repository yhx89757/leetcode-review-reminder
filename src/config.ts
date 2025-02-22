import * as vscode from 'vscode';

export interface ExtensionConfig {
  reviewFilePath: string;
  supportedExtensions: string[];
}

export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('leetcodeReviewReminder');
  return {
    reviewFilePath: config.get('reviewFilePath', 'TODAY_REVIEW.md'),
    supportedExtensions: config.get('supportedExtensions', ['.py', '.js', '.java'])
  };
}
