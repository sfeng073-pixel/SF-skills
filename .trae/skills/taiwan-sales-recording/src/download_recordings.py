#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
录音批量下载模块
通过 cc-workbench2 CLI 批量下载通话录音

注意：此模块需要在本地环境运行（需要浏览器CDP）
"""

import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime


class RecordingDownloader:
    """录音下载器"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化录音下载器

        Args:
            config_path: 配置文件路径
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        self.cli_path = self.config.get('cli_paths', {}).get('cc_workbench', 'cc-workbench2')
        storage_config = self.config.get('storage', {})
        self.temp_dir = Path(storage_config.get('temp_recording_dir', '/tmp/taiwan_recordings'))
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def download_single(self, wandou_id: str, call_id: str) -> Dict:
        """
        下载单条录音

        Args:
            wandou_id: 学员ID
            call_id: 通话记录ID

        Returns:
            下载结果
        """
        # TODO: 实现调用 cc-workbench2 call-recording-download
        # 命令示例：
        # cc-workbench2 call-recording-download \
        #   --wandou-id {wandou_id} \
        #   --call-id {call_id} \
        #   --output-dir {self.temp_dir}
        raise NotImplementedError("需要在本地环境运行，调用 cc-workbench2 CLI")

    def download_batch(self, call_list: List[Dict], max_workers: int = 1) -> List[Dict]:
        """
        批量下载录音

        Args:
            call_list: 通话记录列表
            max_workers: 最大并发数（建议为1，避免CDP冲突）

        Returns:
            下载结果列表
        """
        results = []
        for call in call_list:
            try:
                result = self.download_single(
                    wandou_id=call.get('wandou_id'),
                    call_id=call.get('call_id')
                )
                results.append({
                    **call,
                    'status': 'success',
                    'file_path': result.get('file_path')
                })
            except Exception as e:
                results.append({
                    **call,
                    'status': 'failed',
                    'error': str(e)
                })

        return results

    def get_downloaded_files(self) -> List[Path]:
        """
        获取已下载的录音文件列表

        Returns:
            录音文件路径列表
        """
        if not self.temp_dir.exists():
            return []

        return list(self.temp_dir.glob('*.wav'))


def main():
    """测试脚本"""
    print("=" * 50)
    print("录音批量下载模块")
    print("=" * 50)
    print("\n此模块需要在本地环境运行")
    print("需要先启动 Chrome: chrome --remote-debugging-port=9222")
    print("\n示例命令：")
    print("  cc-workbench2 call-recording-download \\")
    print("    --wandou-id <id> \\")
    print("    --call-id <call_id> \\")
    print("    --output-dir /tmp/taiwan_recordings")


if __name__ == '__main__':
    main()
