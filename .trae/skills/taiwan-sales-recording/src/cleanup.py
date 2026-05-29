#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地录音文件清理模块
分析完成后自动清理本地录音文件，节省存储空间
"""

import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RecordingCleanup:
    """本地录音文件清理器"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化清理器

        Args:
            config_path: 配置文件路径
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        storage_config = self.config.get('storage', {})
        self.temp_dir = Path(storage_config.get('temp_recording_dir', '/tmp/taiwan_recordings'))
        self.log_dir = Path(storage_config.get('log_dir', '~/.taiwan-recording/logs')).expanduser()

        # 确保日志目录存在
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def get_file_info(self, file_path: Path) -> Dict:
        """
        获取文件信息

        Args:
            file_path: 文件路径

        Returns:
            文件信息字典
        """
        stat = file_path.stat()
        return {
            'path': str(file_path),
            'name': file_path.name,
            'size': stat.st_size,
            'size_mb': stat.st_size / (1024 * 1024),
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime)
        }

    def list_recordings(self) -> List[Dict]:
        """
        列出临时目录中的所有录音文件

        Returns:
            录音文件列表
        """
        if not self.temp_dir.exists():
            logger.warning(f"临时目录不存在: {self.temp_dir}")
            return []

        recordings = []
        for file_path in self.temp_dir.rglob('*.wav'):
            recordings.append(self.get_file_info(file_path))

        return recordings

    def cleanup_recordings(self, batch_id: Optional[str] = None, force: bool = False) -> Dict:
        """
        清理录音文件

        Args:
            batch_id: 要清理的批次ID，None表示清理所有
            force: 是否强制清理（忽略保护期）

        Returns:
            清理结果
        """
        recordings = self.list_recordings()

        if not recordings:
            return {
                "success": True,
                "message": "没有需要清理的录音文件",
                "cleaned_count": 0,
                "freed_space_mb": 0
            }

        total_size = sum(r['size_mb'] for r in recordings)
        cleaned_count = 0
        errors = []

        for recording in recordings:
            try:
                file_path = Path(recording['path'])
                file_path.unlink()
                cleaned_count += 1
                logger.info(f"已删除: {recording['name']} ({recording['size_mb']:.2f}MB)")
            except Exception as e:
                error_msg = f"删除失败 {recording['name']}: {e}"
                logger.error(error_msg)
                errors.append(error_msg)

        # 记录清理日志
        self._log_cleanup(cleaned_count, total_size, batch_id)

        return {
            "success": len(errors) == 0,
            "message": f"清理完成：删除 {cleaned_count}/{len(recordings)} 个文件",
            "cleaned_count": cleaned_count,
            "freed_space_mb": round(total_size, 2),
            "errors": errors if errors else None
        }

    def _log_cleanup(self, cleaned_count: int, freed_space: float, batch_id: Optional[str]):
        """记录清理日志"""
        log_file = self.log_dir / f"cleanup_{datetime.now().strftime('%Y%m%d')}.log"

        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "batch_id": batch_id,
            "cleaned_count": cleaned_count,
            "freed_space_mb": freed_space
        }

        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

    def get_storage_stats(self) -> Dict:
        """
        获取存储统计信息

        Returns:
            存储统计
        """
        recordings = self.list_recordings()

        if not recordings:
            return {
                "temp_dir": str(self.temp_dir),
                "exists": self.temp_dir.exists(),
                "file_count": 0,
                "total_size_mb": 0,
                "oldest_file": None,
                "newest_file": None
            }

        total_size = sum(r['size_mb'] for r in recordings)
        oldest = min(recordings, key=lambda x: x['created'])
        newest = max(recordings, key=lambda x: x['created'])

        return {
            "temp_dir": str(self.temp_dir),
            "exists": self.temp_dir.exists(),
            "file_count": len(recordings),
            "total_size_mb": round(total_size, 2),
            "oldest_file": oldest['created'].isoformat(),
            "newest_file": newest['created'].isoformat()
        }


def main():
    """测试脚本"""
    cleanup = RecordingCleanup()

    print("=" * 60)
    print("本地录音文件清理工具")
    print("=" * 60)

    # 查看存储统计
    print("\n📊 存储统计:")
    stats = cleanup.get_storage_stats()
    print(f"  临时目录: {stats['temp_dir']}")
    print(f"  文件数量: {stats['file_count']}")
    print(f"  占用空间: {stats['total_size_mb']:.2f} MB")

    if stats['file_count'] > 0:
        print(f"  最旧文件: {stats['oldest_file']}")
        print(f"  最新文件: {stats['newest_file']}")

    # 列出文件
    if stats['file_count'] > 0:
        print("\n📁 文件列表:")
        recordings = cleanup.list_recordings()
        for r in recordings:
            print(f"  - {r['name']} ({r['size_mb']:.2f}MB)")

    # 执行清理
    print("\n🧹 执行清理...")
    result = cleanup.cleanup_recordings()

    print(f"\n✅ 清理结果:")
    print(f"  删除文件数: {result['cleaned_count']}")
    print(f"  释放空间: {result['freed_space_mb']:.2f} MB")

    if result.get('errors'):
        print(f"\n❌ 错误:")
        for err in result['errors']:
            print(f"  - {err}")


if __name__ == '__main__':
    main()
