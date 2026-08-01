import React, { useState, useRef } from 'react';
import { useStore } from '@store';
import { Button, Input, useToast } from '@ui/components/common';
import { getI18nAPI } from '@platform/browser-api';
import './DebugPanel.css';

export function DebugPanel() {
  const { debug, setDebugIp, setDebugPort, setDebugWsConnected, addDebugLog, clearDebugLogs } = useStore();
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const { show: showToast } = useToast();
  const i18n = getI18nAPI();

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ip = debug.ip.join('.');
    const port = debug.port;
    const wsUrl = `ws://${ip}:${port + 1}`;

    addDebugLog(`[${new Date().toLocaleTimeString()}] 正在连接 ${wsUrl}...`);

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] WebSocket 已连接`);
        setDebugWsConnected(true);
        setReconnectCount(0);
        showToast('调试连接成功', 'success');
      };

      socket.onmessage = (event) => {
        if (!isPaused) {
          addDebugLog(`[${new Date().toLocaleTimeString()}] ${event.data}`);
          setTimeout(() => {
            const container = logContainerRef.current;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 0);
        }
      };

      socket.onclose = () => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] WebSocket 已断开`);
        setDebugWsConnected(false);
        if (reconnectCount < 3) {
          const nextCount = reconnectCount + 1;
          setReconnectCount(nextCount);
          addDebugLog(`[${new Date().toLocaleTimeString()}] ${nextCount}秒后尝试重连...`);
          setTimeout(connect, nextCount * 1000);
        } else {
          showToast('重连次数超限，请检查 Legado APP', 'error');
        }
      };

      socket.onerror = (_error) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] 连接错误`);
        showToast('WebSocket 连接失败', 'error');
      };
    } catch (e) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] 创建连接失败: ${e}`);
      showToast('无法创建 WebSocket 连接', 'error');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setDebugWsConnected(false);
      addDebugLog(`[${new Date().toLocaleTimeString()}] 已手动断开`);
    }
  };

  const sendBookSource = async () => {
    const { exportState } = useStore.getState();
    const state = exportState();
    const ip = debug.ip.join('.');
    const port = debug.port;
    const url = `http://${ip}:${port}/saveBookSource`;

    addDebugLog(`[${new Date().toLocaleTimeString()}] 发送书源到 ${url}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: state
      });
      if (response.ok) {
        addDebugLog(`[${new Date().toLocaleTimeString()}] 书源发送成功，状态码: ${response.status}`);
        showToast('书源已发送到 Legado APP', 'success');
        setTimeout(connect, 500);
      } else {
        addDebugLog(`[${new Date().toLocaleTimeString()}] 发送失败: ${response.status} ${response.statusText}`);
        showToast(`发送失败: ${response.status}`, 'error');
      }
    } catch (e) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] 发送异常: ${e}`);
      showToast('网络错误，请检查 IP/端口', 'error');
    }
  };

  const handleStartDebug = () => {
    sendBookSource();
  };

  const handleClearLogs = () => {
    clearDebugLogs();
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(debug.logs.join('\n'));
    showToast('日志已复制到剪贴板', 'success');
  };

  const handleIpChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      const newIp = [...debug.ip];
      newIp[index] = String(num);
      setDebugIp(newIp);
    }
  };

  return (
    <div className="debug-panel">
      <div className="debug-panel__connection">
        <h3 className="debug-panel__title">{i18n.getMessage('debugTitle') || '调试面板'}</h3>
        <div className="debug-panel__ip-inputs">
          {debug.ip.map((segment, index) => (
            <Input
              key={index}
              type="number"
              min="0"
              max="255"
              value={segment}
              onChange={e => handleIpChange(index, e.target.value)}
              style={{ width: '60px' }}
              placeholder={index === 0 ? '192' : index === 1 ? '168' : index === 2 ? '1' : '100'}
            />
          ))}
        </div>
        <Input
          type="number"
          min="1"
          max="65535"
          label="端口"
          value={debug.port}
          onChange={e => setDebugPort(parseInt(e.target.value, 10) || 8080)}
          style={{ width: '100px' }}
        />
        <div className="debug-panel__buttons">
          <Button variant={debug.wsConnected ? 'secondary' : 'primary'} onClick={handleStartDebug} disabled={debug.wsConnected}>
            {debug.wsConnected ? '已连接' : '开始调试'}
          </Button>
          <Button variant="danger" onClick={disconnect} disabled={!debug.wsConnected}>断开</Button>
        </div>
        <div className="debug-panel__status">
          状态: <span className={debug.wsConnected ? 'debug-panel__status--connected' : 'debug-panel__status--disconnected'}>
            {debug.wsConnected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      <div className="debug-panel__log-toolbar">
        <label className="debug-panel__pause-toggle">
          <input type="checkbox" checked={isPaused} onChange={e => setIsPaused(e.target.checked)} />
          暂停日志
        </label>
        <Button variant="ghost" size="sm" onClick={handleClearLogs}>清空</Button>
        <Button variant="ghost" size="sm" onClick={handleCopyLogs}>复制</Button>
      </div>

      <div className="debug-panel__log-container" ref={logContainerRef}>
        {debug.logs.map((log, index) => (
          <div key={index} className="debug-panel__log-line">{log}</div>
        ))}
      </div>
    </div>
  );
}