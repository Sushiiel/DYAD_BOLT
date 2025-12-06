import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';


interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  return (
    <div className="relative w-full max-w-7xl mx-auto z-prompt">
      {/* Unified Container with Border */}
      <div className="border-4 border-white bg-black">

        {/* Top Section - Model Configuration & Tools (Collapsible) */}
        <div className={classNames(
          "border-b-4 border-white transition-all duration-300",
          props.isModelSettingsCollapsed ? "h-0 overflow-hidden" : "p-8"
        )}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model Configuration */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-sm font-black uppercase tracking-widest">Model Configuration</h3>
              </div>
              <ClientOnly>
                {() => (
                  <div className="space-y-6">
                    <ModelSelector
                      key={props.provider?.name + ':' + props.modelList.length}
                      model={props.model}
                      setModel={props.setModel}
                      modelList={props.modelList}
                      provider={props.provider}
                      setProvider={props.setProvider}
                      providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                      apiKeys={props.apiKeys}
                      modelLoading={props.isModelLoading}
                    />
                    {(props.providerList || []).length > 0 &&
                      props.provider &&
                      (!LOCAL_PROVIDERS.includes(props.provider.name) || 'OpenAILike') && (
                        <div className="pt-4 border-t-2 border-white/20">
                          <APIKeyManager
                            provider={props.provider}
                            apiKey={props.apiKeys[props.provider.name] || ''}
                            setApiKey={(key) => {
                              props.onApiKeysChange(props.provider.name, key);
                            }}
                          />
                        </div>
                      )}
                  </div>
                )}
              </ClientOnly>
            </div>

            {/* Tools Panel */}
            <div>
              <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6">Tools & Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  title="Upload file"
                  className="flex flex-col items-center gap-3 p-4 bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all"
                  onClick={() => props.handleFileUpload()}
                >
                  <div className="i-ph:paperclip text-2xl"></div>
                  <span className="text-xs font-black uppercase">Upload</span>
                </button>

                <button
                  title="Enhance prompt"
                  disabled={props.input.length === 0 || props.enhancingPrompt}
                  className="flex flex-col items-center gap-3 p-4 bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => {
                    props.enhancePrompt?.();
                    toast.success('Prompt enhanced!');
                  }}
                >
                  {props.enhancingPrompt ? (
                    <div className="i-svg-spinners:90-ring-with-bg text-2xl animate-spin"></div>
                  ) : (
                    <div className="i-bolt:stars text-2xl"></div>
                  )}
                  <span className="text-xs font-black uppercase">Enhance</span>
                </button>

                <SpeechRecognitionButton
                  isListening={props.isListening}
                  onStart={props.startListening}
                  onStop={props.stopListening}
                  disabled={props.isStreaming}
                />

                <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />

                {props.chatStarted && (
                  <button
                    className={classNames(
                      "col-span-2 p-4 border-2 border-white transition-all flex items-center justify-center gap-3",
                      props.chatMode === 'discuss'
                        ? 'bg-white text-black'
                        : 'bg-black text-white hover:bg-white hover:text-black',
                    )}
                    onClick={() => {
                      props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                    }}
                  >
                    <div className="i-ph:chats text-xl" />
                    <span className="text-xs font-black uppercase">
                      {props.chatMode === 'discuss' ? 'Discuss Mode' : 'Build Mode'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
          className="w-full py-3 bg-black text-white hover:bg-white hover:text-black border-b-4 border-white transition-all flex items-center justify-center gap-3"
          disabled={!props.providerList || props.providerList.length === 0}
        >
          <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'down' : 'up'} text-xl`} />
          <span className="text-xs font-black uppercase tracking-widest">
            {props.isModelSettingsCollapsed ? 'Show Settings' : 'Hide Settings'}
          </span>
          {props.isModelSettingsCollapsed && <span className="text-xs opacity-60">({props.model})</span>}
        </button>

        {/* Selected Element Indicator */}
        {props.selectedElement && (
          <div className="p-4 bg-black border-b-4 border-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white text-xs font-black uppercase tracking-wider">Inspecting:</span>
              <code className="bg-white text-black px-3 py-1.5 font-mono text-sm font-bold">
                {props?.selectedElement?.tagName}
              </code>
            </div>
            <button
              className="bg-white text-black px-4 py-2 hover:bg-black hover:text-white border-2 border-white transition-all text-xs font-black uppercase"
              onClick={() => props.setSelectedElement?.(null)}
            >
              Clear
            </button>
          </div>
        )}

        {/* File Preview */}
        {(props.uploadedFiles.length > 0 || props.imageDataList.length > 0) && (
          <div className="p-6 bg-black border-b-4 border-white">
            <h3 className="text-white text-sm font-black uppercase tracking-widest mb-4">Attachments</h3>
            <FilePreview
              files={props.uploadedFiles}
              imageDataList={props.imageDataList}
              onRemove={(index) => {
                props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
                props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
              }}
            />
          </div>
        )}

        {/* Main Input Area */}
        <div className="relative p-8">
          <textarea
            ref={props.textareaRef}
            className="w-full px-6 py-6 bg-black text-white placeholder-white/40 outline-none resize-none text-lg font-mono leading-relaxed border-2 border-white/40 focus:border-white transition-all"
            onDragEnter={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.borderWidth = '4px';
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderWidth = '2px';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderWidth = '2px';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';

              const files = Array.from(e.dataTransfer.files);
              files.forEach((file) => {
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const base64Image = e.target?.result as string;
                    props.setUploadedFiles?.([...props.uploadedFiles, file]);
                    props.setImageDataList?.([...props.imageDataList, base64Image]);
                  };
                  reader.readAsDataURL(file);
                }
              });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (props.isStreaming) {
                  props.handleStop?.();
                } else if (!event.nativeEvent.isComposing) {
                  props.handleSendMessage?.(event);
                }
              }
            }}
            value={props.input}
            onChange={(event) => props.handleInputChange?.(event)}
            onPaste={props.handlePaste}
            style={{
              minHeight: props.TEXTAREA_MIN_HEIGHT,
              maxHeight: props.TEXTAREA_MAX_HEIGHT,
            }}
            placeholder={props.chatMode === 'build' ? '▸ DESCRIBE YOUR PROJECT...' : '▸ START CONVERSATION...'}
            translate="no"
          />

          {/* Send Button - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <ClientOnly>
              {() => (
                <SendButton
                  show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                  isStreaming={props.isStreaming}
                  disabled={!props.providerList || props.providerList.length === 0}
                  onClick={(event) => {
                    if (props.isStreaming) {
                      props.handleStop?.();
                    } else if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                      props.handleSendMessage?.(event);
                    }
                  }}
                />
              )}
            </ClientOnly>
          </div>

          {/* Keyboard Hint */}
          {props.input.length > 3 && (
            <div className="absolute bottom-12 left-12 text-white/40 text-xs font-mono hidden lg:block">
              <kbd className="px-2 py-1 border border-white/40">SHIFT</kbd> + <kbd className="px-2 py-1 border border-white/40">ENTER</kbd> = NEW LINE
            </div>
          )}

          {/* Input Stats */}
          {props.input.length > 0 && (
            <div className="flex justify-between items-center mt-4 px-2 text-white/60 text-xs font-mono">
              <span>{props.input.length} CHARACTERS</span>
              <span>{props.input.split(/\s+/).length} WORDS</span>
            </div>
          )}
        </div>
      </div>

      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>

      <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
    </div>
  );
};
