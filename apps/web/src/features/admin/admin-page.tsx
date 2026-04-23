import { Button, Card, CardBody, CardHeader, Input, Label } from '@kairo/ui';
import { useEffect, useState } from 'react';
import { api } from '../../shared/lib/api-client';

interface AdminConfig {
  siteName: string;
  allowRegistration: boolean;
  enabledLoginMethods: string[];
  mapProvider: 'osm' | 'amap' | 'google';
  ipAllowlist: string[];
  ipBlocklist: string[];
  countryAllowlist: string[];
  countryBlocklist: string[];
}

interface InviteResult {
  token: string;
  expiresAt: string;
}

export function AdminPage() {
  const [cfg, setCfg] = useState<AdminConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    api<AdminConfig>('/admin/config')
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  async function generateInvite() {
    setInviting(true);
    try {
      const res = await api<InviteResult>('/admin/invite', { method: 'POST' });
      setInvite(res);
    } catch {
      setInvite(null);
    } finally {
      setInviting(false);
    }
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    setMessage(null);
    try {
      const next = await api<AdminConfig>('/admin/config', { method: 'PATCH', json: cfg });
      setCfg(next);
      setMessage('已保存');
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) return <div className="text-fg-muted p-8">加载中…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">管理面板</h1>
          <p className="text-fg-muted text-xs">仅管理员可见</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">基础</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <Label>站点名</Label>
            <Input
              value={cfg.siteName}
              onChange={(e) => setCfg({ ...cfg, siteName: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cfg.allowRegistration}
              onChange={(e) => setCfg({ ...cfg, allowRegistration: e.target.checked })}
            />
            允许公开注册
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">访问限制</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <Label>IP 白名单（逗号分隔 CIDR/IP，留空关闭）</Label>
            <Input
              value={cfg.ipAllowlist.join(',')}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  ipAllowlist: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <Label>IP 黑名单</Label>
            <Input
              value={cfg.ipBlocklist.join(',')}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  ipBlocklist: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <Label>国家/地区白名单（ISO-2，如 CN,HK）</Label>
            <Input
              value={cfg.countryAllowlist.join(',')}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  countryAllowlist: e.target.value
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <Label>国家/地区黑名单</Label>
            <Input
              value={cfg.countryBlocklist.join(',')}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  countryBlocklist: e.target.value
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">地图</h2>
        </CardHeader>
        <CardBody>
          <select
            value={cfg.mapProvider}
            onChange={(e) =>
              setCfg({ ...cfg, mapProvider: e.target.value as AdminConfig['mapProvider'] })
            }
            className="border-border bg-surface rounded-md border px-3 py-2 text-sm"
          >
            <option value="osm">OpenStreetMap（免费）</option>
            <option value="amap">高德</option>
            <option value="google">Google</option>
          </select>
        </CardBody>
      </Card>

      {/* Invite token section */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">邀请注册</h2>
          <p className="text-fg-muted text-xs">
            公开注册关闭时，可生成一次性邀请链接（7 天有效）发送给受邀用户。
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          <Button onClick={generateInvite} disabled={inviting} variant="secondary">
            {inviting ? '生成中…' : '生成邀请链接'}
          </Button>
          {invite && (
            <div className="border-border bg-surface-muted space-y-1 rounded-lg border p-3">
              <p className="text-fg-muted text-xs">
                有效至：{new Date(invite.expiresAt).toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/register?invite=${invite.token}`}
                  className="border-border bg-surface flex-1 rounded border px-3 py-1.5 font-mono text-xs outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/register?invite=${invite.token}`,
                    )
                  }
                >
                  复制
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
        {message && <span className="text-fg-muted text-sm">{message}</span>}
      </div>
    </div>
  );
}
