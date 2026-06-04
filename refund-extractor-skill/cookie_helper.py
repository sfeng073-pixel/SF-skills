#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cookie自动获取助手

功能：
1. 检测Cookie是否有效
2. 如果无效，自动打开浏览器让用户登录
3. 登录后自动提取Cookie并保存

使用方法：
    from cookie_helper import CookieHelper
    helper = CookieHelper()
    cookies = helper.get_cookies()
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

# Cookie文件路径
COOKIE_FILE = Path.home() / "refund-extractor" / ".lanling_cookies.json"

# 蓝凌OA登录页面（需要配置）
LANLING_LOGIN_URL = os.environ.get("LANLING_LOGIN_URL", "https://your-lanling-domain.com/km/review/")


class CookieHelper:
    """Cookie自动获取助手"""

    def __init__(self, cookie_file=None, login_url=None):
        self.cookie_file = Path(cookie_file) if cookie_file else COOKIE_FILE
        self.login_url = login_url or LANLING_LOGIN_URL
        self.cookie_file.parent.mkdir(parents=True, exist_ok=True)

    def load_cookies(self):
        """从文件加载Cookie"""
        if self.cookie_file.exists():
            try:
                with open(self.cookie_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"加载Cookie失败: {e}")
                return {}
        return {}

    def save_cookies(self, cookies):
        """保存Cookie到文件"""
        try:
            with open(self.cookie_file, 'w') as f:
                json.dump(cookies, f, indent=2)
            print(f"Cookie已保存到: {self.cookie_file}")
            return True
        except Exception as e:
            print(f"保存Cookie失败: {e}")
            return False

    def check_cookies_valid(self, cookies):
        """检查Cookie是否有效（简单检查关键字段是否存在）"""
        if not cookies:
            return False
        # 检查是否有JSESSIONID或LtpaToken（蓝凌OA常用）
        has_jsession = 'JSESSIONID' in cookies
        has_ltpa = 'LtpaToken' in cookies
        return has_jsession or has_ltpa

    def get_cookies_from_browser(self):
        """
        自动获取浏览器Cookie
        
        方案1: 尝试使用browser_cookie3库（需要已安装）
        方案2: 使用Playwright自动打开浏览器
        方案3: 提示用户手动复制
        """
        # 先尝试方案1: browser_cookie3
        cookies = self._try_browser_cookie3()
        if cookies and self.check_cookies_valid(cookies):
            print("✅ 自动从浏览器获取Cookie成功")
            return cookies

        # 方案2: Playwright
        cookies = self._try_playwright()
        if cookies and self.check_cookies_valid(cookies):
            print("✅ 通过Playwright自动获取Cookie成功")
            return cookies

        # 方案3: 手动输入
        return self._manual_input()

    def _try_browser_cookie3(self):
        """尝试使用browser_cookie3库获取Cookie"""
        try:
            import browser_cookie3
            
            # 尝试从Chrome获取
            print("正在尝试从Chrome浏览器获取Cookie...")
            cj = browser_cookie3.chrome(domain_name=self.login_url.split('/')[2])
            
            cookies = {}
            for cookie in cj:
                cookies[cookie.name] = cookie.value
            
            if cookies:
                print(f"从Chrome获取到 {len(cookies)} 个Cookie")
                return cookies
            
            # 尝试从Edge获取
            print("正在尝试从Edge浏览器获取Cookie...")
            cj = browser_cookie3.edge(domain_name=self.login_url.split('/')[2])
            
            cookies = {}
            for cookie in cj:
                cookies[cookie.name] = cookie.value
            
            if cookies:
                print(f"从Edge获取到 {len(cookies)} 个Cookie")
                return cookies
                
        except ImportError:
            print("browser_cookie3未安装，跳过自动获取")
        except Exception as e:
            print(f"browser_cookie3获取失败: {e}")
        
        return {}

    def _try_playwright(self):
        """使用Playwright自动打开浏览器获取Cookie"""
        try:
            from playwright.sync_api import sync_playwright
            
            print("\n" + "="*60)
            print("将自动打开浏览器，请完成登录")
            print("="*60)
            print("\n操作步骤：")
            print("1. 浏览器会自动打开蓝凌OA页面")
            print("2. 请扫码或输入账号密码登录")
            print("3. 登录成功后，按回车键继续")
            print("4. 程序会自动提取Cookie")
            print("="*60 + "\n")
            
            with sync_playwright() as p:
                # 启动浏览器（使用用户数据目录，保持登录状态）
                browser = p.chromium.launch(headless=False)
                context = browser.new_context()
                page = context.new_page()
                
                # 打开登录页面
                print(f"正在打开: {self.login_url}")
                page.goto(self.login_url)
                
                # 等待用户登录
                input("\n请完成登录，然后按回车键继续...")
                
                # 获取Cookie
                cookies = context.cookies()
                cookie_dict = {}
                for cookie in cookies:
                    cookie_dict[cookie['name']] = cookie['value']
                
                browser.close()
                
                if cookie_dict:
                    print(f"获取到 {len(cookie_dict)} 个Cookie")
                    return cookie_dict
                else:
                    print("未获取到Cookie")
                    return {}
                    
        except ImportError:
            print("Playwright未安装，跳过自动获取")
            print("安装命令: pip install playwright && playwright install chromium")
        except Exception as e:
            print(f"Playwright获取失败: {e}")
        
        return {}

    def _manual_input(self):
        """手动输入Cookie"""
        print("\n" + "="*60)
        print("需要手动获取Cookie")
        print("="*60)
        print("\n请按以下步骤操作：")
        print("1. 在Chrome中打开蓝凌OA页面（从钉钉工作台进入）")
        print("2. 确保已登录")
        print("3. 按 F12 打开开发者工具")
        print("4. 切换到 Console 标签")
        print("5. 输入: document.cookie")
        print("6. 复制输出的字符串")
        print("7. 粘贴到下面")
        print("="*60 + "\n")
        
        cookie_str = input("请输入Cookie字符串: ").strip()
        
        if not cookie_str:
            print("未输入Cookie")
            return {}
        
        # 解析Cookie字符串
        cookies = {}
        
        # 处理可能带引号的情况
        if cookie_str.startswith('"') and cookie_str.endswith('"'):
            cookie_str = cookie_str[1:-1]
        
        for item in cookie_str.split(';'):
            item = item.strip()
            if '=' in item:
                k, v = item.split('=', 1)
                cookies[k.strip()] = v.strip()
        
        return cookies

    def get_cookies(self):
        """
        获取有效Cookie的主入口
        
        流程：
        1. 尝试加载已有Cookie
        2. 检查是否有效
        3. 如果无效，自动获取新Cookie
        4. 保存并返回
        """
        # 1. 加载已有Cookie
        cookies = self.load_cookies()
        
        # 2. 检查是否有效
        if self.check_cookies_valid(cookies):
            print("✅ 已有Cookie有效")
            return cookies
        
        print("Cookie无效或不存在，需要重新获取")
        
        # 3. 自动获取新Cookie
        cookies = self.get_cookies_from_browser()
        
        # 4. 验证并保存
        if self.check_cookies_valid(cookies):
            self.save_cookies(cookies)
            print("✅ Cookie获取成功")
            return cookies
        else:
            print("❌ Cookie获取失败")
            return {}


def main():
    """测试Cookie获取"""
    helper = CookieHelper()
    cookies = helper.get_cookies()
    
    if cookies:
        print(f"\n获取到 {len(cookies)} 个Cookie:")
        for name in cookies:
            # 只显示Cookie名称，不显示值（安全）
            print(f"  - {name}")
    else:
        print("\n未能获取到有效Cookie")
        sys.exit(1)


if __name__ == "__main__":
    main()
