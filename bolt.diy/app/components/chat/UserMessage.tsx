/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { Markdown } from './Markdown';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
  parts:
  | (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[]
  | undefined;
}

export function UserMessage({ content, parts }: UserMessageProps) {
  const profile = useStore(profileStore);

  // Extract images from parts - look for file parts with image mime types
  const images =
    parts?.filter(
      (part): part is FileUIPart => part.type === 'file' && 'mimeType' in part && part.mimeType.startsWith('image/'),
    ) || [];

  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === 'text');
    const textContent = stripMetadata(textItem?.text || '');

    return (
      <div className="flex flex-col gap-4 items-end max-w-[85%] ml-auto">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-sm font-medium text-bolt-elements-textPrimary">
            {profile?.username || 'You'}
          </span>
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile?.username || 'User'}
              className="w-8 h-8 object-cover rounded-full ring-2 ring-bolt-elements-borderColor"
              loading="eager"
              decoding="sync"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-bolt-elements-bg-depth-3 flex items-center justify-center">
              <div className="i-ph:user-fill text-bolt-elements-textSecondary text-lg" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 bg-bolt-elements-bg-depth-3 rounded-3xl rounded-tr-sm p-5 border border-bolt-elements-borderColor">
          {textContent && <Markdown html>{textContent}</Markdown>}
          {images.map((item, index) => (
            <img
              key={index}
              src={`data:${item.mimeType};base64,${item.data}`}
              alt={`Image ${index + 1}`}
              className="max-w-full h-auto rounded-2xl border border-bolt-elements-borderColor"
              style={{ maxHeight: '512px', objectFit: 'contain' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const textContent = stripMetadata(content);

  return (
    <div className="flex flex-col gap-4 items-end max-w-[85%] ml-auto">
      <div className="flex flex-col gap-4 bg-bolt-elements-bg-depth-3 rounded-3xl rounded-tr-sm px-6 py-5 border border-bolt-elements-borderColor">
        <div className="flex gap-4 flex-wrap">
          {images.map((item, index) => (
            <div key={index} className="relative flex rounded-2xl border border-bolt-elements-borderColor overflow-hidden">
              <img
                src={`data:${item.mimeType};base64,${item.data}`}
                alt={`Image ${index + 1}`}
                className="h-20 w-20 object-cover"
              />
            </div>
          ))}
        </div>
        <Markdown html>{textContent}</Markdown>
      </div>
    </div>
  );
}

function stripMetadata(content: string) {
  const artifactRegex = /&lt;boltArtifact\s+[^&gt;]*&gt;[\s\S]*?&lt;\/boltArtifact&gt;/gm;
  return content.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '').replace(artifactRegex, '');
}
