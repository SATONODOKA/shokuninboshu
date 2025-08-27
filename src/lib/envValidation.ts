export interface EnvConfig {
  key: string;
  required: boolean;
  description: string;
  validation?: (value: string) => boolean;
  errorMessage?: string;
}

export const ENV_CONFIGS: EnvConfig[] = [
  {
    key: 'VITE_LINE_LIFF_ID',
    required: true,
    description: 'LINE LIFF アプリID',
    validation: (value: string) => value.length > 10 && value.includes('-'),
    errorMessage: 'LIFF IDの形式が正しくありません'
  },
  {
    key: 'VITE_LINE_CHANNEL_ID',
    required: true,
    description: 'LINE チャネルID',
    validation: (value: string) => /^\d{10}$/.test(value),
    errorMessage: 'チャネルIDは10桁の数字である必要があります'
  },
  {
    key: 'VITE_API_BASE_URL',
    required: false,
    description: 'Netlify Functions ベースURL',
    validation: (value: string) => value.startsWith('http') || value.startsWith('/.netlify'),
    errorMessage: 'APIベースURLの形式が正しくありません'
  }
];

export interface ValidationResult {
  key: string;
  value?: string;
  isValid: boolean;
  error?: string;
  isRequired: boolean;
}

export function validateEnvironmentVariables(): ValidationResult[] {
  return ENV_CONFIGS.map(config => {
    const value = import.meta.env[config.key];
    const hasValue = !!value;
    
    if (!hasValue && config.required) {
      return {
        key: config.key,
        isValid: false,
        error: `${config.description} は必須です`,
        isRequired: config.required
      };
    }
    
    if (hasValue && config.validation && !config.validation(value)) {
      return {
        key: config.key,
        value,
        isValid: false,
        error: config.errorMessage || '値の形式が正しくありません',
        isRequired: config.required
      };
    }
    
    return {
      key: config.key,
      value,
      isValid: true,
      isRequired: config.required
    };
  });
}

export function getValidationSummary() {
  const results = validateEnvironmentVariables();
  const errors = results.filter(r => !r.isValid);
  const warnings = results.filter(r => !r.value && !r.isRequired);
  
  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    results
  };
}