import { memo } from 'react';
import { Input } from './Input';

interface CredentialFieldsProps {
  username: string;
  password: string;
  uuid: string;
  showUuid: boolean;
  showUserPass: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onUuidChange: (value: string) => void;
}

/**
 * Campos de credenciales para autenticación VPN
 */
export const CredentialFields = memo(function CredentialFields({
  username,
  password,
  uuid,
  showUuid,
  showUserPass,
  onUsernameChange,
  onPasswordChange,
  onUuidChange,
}: CredentialFieldsProps) {
  if (!showUserPass && !showUuid) return null;

  return (
    <div className="fields">
      {showUserPass && (
        <>
          <Input
            icon="user"
            placeholder="Usuario"
            value={username}
            onChange={onUsernameChange}
          />
          <Input
            icon="lock"
            placeholder="Contraseña"
            value={password}
            onChange={onPasswordChange}
            toggleVisibility
          />
        </>
      )}
      {showUuid && (
        <Input
          icon="key"
          placeholder="UUID (V2Ray)"
          value={uuid}
          onChange={onUuidChange}
          className={showUserPass ? '' : 'full'}
        />
      )}
    </div>
  );
});
