import React, { useState, useEffect, useCallback } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';
import Cookies from 'js-cookie';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// cache which stores whether the provider's API key is set via environment variable
const providerEnvKeyStatusCache: Record<string, boolean> = {};

const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

export function getApiKeysFromCookies() {
  const storedApiKeys = Cookies.get('apiKeys');
  let parsedKeys: Record<string, string> = {};

  if (storedApiKeys) {
    parsedKeys = apiKeyMemoizeCache[storedApiKeys];

    if (!parsedKeys) {
      parsedKeys = apiKeyMemoizeCache[storedApiKeys] = JSON.parse(storedApiKeys);
    }
  }

  return parsedKeys;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);

  // Reset states and load saved key when provider changes
  useEffect(() => {
    // Load saved API key from cookies for this provider
    const savedKeys = getApiKeysFromCookies();
    const savedKey = savedKeys[provider.name] || '';

    setTempKey(savedKey);
    setApiKey(savedKey);
    setIsEditing(false);
  }, [provider.name]);

  const checkEnvApiKey = useCallback(async () => {
    // Check cache first
    if (providerEnvKeyStatusCache[provider.name] !== undefined) {
      setIsEnvKeySet(providerEnvKeyStatusCache[provider.name]);
      return;
    }

    try {
      const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
      const data = await response.json();
      const isSet = (data as { isSet: boolean }).isSet;

      // Cache the result
      providerEnvKeyStatusCache[provider.name] = isSet;
      setIsEnvKeySet(isSet);
    } catch (error) {
      console.error('Failed to check environment API key:', error);
      setIsEnvKeySet(false);
    }
  }, [provider.name]);

  useEffect(() => {
    checkEnvApiKey();
  }, [checkEnvApiKey]);

  const handleSave = () => {
    // Save to parent state
    setApiKey(tempKey);

    // Save to cookies
    const currentKeys = getApiKeysFromCookies();
    const newKeys = { ...currentKeys, [provider.name]: tempKey };
    Cookies.set('apiKeys', JSON.stringify(newKeys));

    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white uppercase tracking-wider">{provider?.name} API Key:</span>
          {!isEditing && (
            <div className="flex items-center gap-2">
              {apiKey ? (
                <>
                  <div className="i-ph:check-circle-fill text-white w-4 h-4" />
                  <span className="text-xs text-white">Set via UI</span>
                </>
              ) : isEnvKeySet ? (
                <>
                  <div className="i-ph:check-circle-fill text-white w-4 h-4" />
                  <span className="text-xs text-white">Set via environment variable</span>
                </>
              ) : (
                <>
                  <div className="i-ph:x-circle-fill text-white/60 w-4 h-4" />
                  <span className="text-xs text-white/60">Not Set (Set via UI or ENV)</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={tempKey}
              placeholder="ENTER API KEY..."
              onChange={(e) => setTempKey(e.target.value)}
              className="w-[300px] px-3 py-2 text-sm border-2 border-white/60 bg-black text-white placeholder:text-white/40 focus:outline-none focus:border-white font-mono uppercase"
            />
            <IconButton
              onClick={handleSave}
              title="Save API Key"
              className="!bg-white !text-black hover:!bg-white/80 border-2 border-white"
            >
              <div className="i-ph:check w-4 h-4 !text-black" />
            </IconButton>
            <IconButton
              onClick={() => setIsEditing(false)}
              title="Cancel"
              className="!bg-black !text-white hover:!bg-white hover:!text-black border-2 border-white"
            >
              <div className="i-ph:x w-4 h-4" />
            </IconButton>
          </div>
        ) : (
          <>
            {
              <IconButton
                onClick={() => setIsEditing(true)}
                title="Edit API Key"
                className="!bg-white !text-black hover:!bg-white/80 border-2 border-white"
              >
                <div className="i-ph:pencil-simple w-4 h-4 !text-black" />
              </IconButton>
            }
            {provider?.getApiKeyLink && !apiKey && (
              <IconButton
                onClick={() => window.open(provider?.getApiKeyLink)}
                title="Get API Key"
                className="!bg-white !text-black hover:!bg-white/80 border-2 border-white flex items-center gap-2 px-3"
              >
                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap !text-black">{provider?.labelForGetApiKey || 'Get API Key'}</span>
                <div className={`${provider?.icon || 'i-ph:key'} w-4 h-4 !text-black`} />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};
