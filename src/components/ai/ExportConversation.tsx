import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Conversation, ChatMessage } from '@/hooks/useRAGChat';

interface ExportConversationProps {
    conversation: Conversation;
    messages: ChatMessage[];
}

export function ExportConversation({ conversation, messages }: ExportConversationProps) {
    const exportAsMarkdown = () => {
        const title = conversation.title || 'Untitled Conversation';
        const date = new Date(conversation.created_at).toLocaleDateString();

        let markdown = `# ${title}\n\n`;
        markdown += `**Created:** ${date}\n\n`;
        markdown += `---\n\n`;

        messages.forEach((msg) => {
            const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
            markdown += `## ${role}\n\n`;
            markdown += `${msg.content}\n\n`;

            if (msg.sources && msg.sources.length > 0) {
                markdown += `<details>\n<summary>Sources</summary>\n\n`;
                msg.sources.forEach((source: any, idx: number) => {
                    markdown += `**Source ${idx + 1}:**\n${source.content}\n\n`;
                });
                markdown += `</details>\n\n`;
            }
        });

        downloadFile(markdown, `${sanitizeFilename(title)}.md`, 'text/markdown');
    };

    const exportAsJSON = () => {
        const exportData = {
            conversation: {
                id: conversation.id,
                title: conversation.title,
                created_at: conversation.created_at,
                updated_at: conversation.updated_at,
                settings: {
                    context_window: conversation.context_window,
                    temperature: conversation.temperature,
                    max_tokens: conversation.max_tokens,
                },
            },
            messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                sources: msg.sources,
                created_at: msg.created_at,
            })),
            exported_at: new Date().toISOString(),
        };

        const json = JSON.stringify(exportData, null, 2);
        const title = conversation.title || 'Untitled Conversation';
        downloadFile(json, `${sanitizeFilename(title)}.json`, 'application/json');
    };

    const exportAsText = () => {
        const title = conversation.title || 'Untitled Conversation';
        const date = new Date(conversation.created_at).toLocaleDateString();

        let text = `${title}\n`;
        text += `Created: ${date}\n`;
        text += `${'='.repeat(60)}\n\n`;

        messages.forEach((msg) => {
            const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
            text += `[${role}]\n`;
            text += `${msg.content}\n\n`;
            text += `${'-'.repeat(60)}\n\n`;
        });

        downloadFile(text, `${sanitizeFilename(title)}.txt`, 'text/plain');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsMarkdown}>
                    Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsJSON}>
                    JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsText}>
                    Plain Text (.txt)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Helper functions
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
