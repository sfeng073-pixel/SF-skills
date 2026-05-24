#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用示例 - LINE Chat Analyzer
"""

from line_chat_analyzer import LineChatAnalyzer


def main():
    # 初始化分析器
    analyzer = LineChatAnalyzer()
    
    # 示例1: 分析单个文件
    print("=" * 60)
    print("示例1: 分析单个文件")
    print("=" * 60)
    
    result = analyzer.analyze_file('path/to/chat_record.csv')
    print(f"文件名: {result['filename']}")
    print(f"消息总数: {result['message_count']}")
    print(f"客服消息数: {result['staff_message_count']}")
    print(f"用户消息数: {result['user_message_count']}")
    
    if 'compliance' in result:
        comp = result['compliance']
        print(f"\n合规检查结果:")
        print(f"  已报名: {'是' if comp['is_signed'] else '否'}")
        print(f"  入学指南: {'✓' if comp['has_enrollment_guide'] else '✗'}")
        print(f"  打卡沟通: {'✓' if comp['has_checkin'] else '✗'}")
        print(f"  状态: {comp['compliance_status']}")
    
    # 示例2: 批量分析目录
    print("\n" + "=" * 60)
    print("示例2: 批量分析目录")
    print("=" * 60)
    
    results = analyzer.analyze_directory('/path/to/chats/')
    print(f"共分析 {len(results)} 个文件")
    
    # 示例3: 筛选5月份数据
    print("\n" + "=" * 60)
    print("示例3: 筛选5月份数据")
    print("=" * 60)
    
    may_results = analyzer.filter_by_date(results, 2025, 5)
    print(f"5月份数据共 {len(may_results)} 个")
    
    # 示例4: 筛选已报名用户
    print("\n" + "=" * 60)
    print("示例4: 筛选已报名用户")
    print("=" * 60)
    
    signed_users = analyzer.filter_signed_users(results)
    print(f"已报名用户共 {len(signed_users)} 个")
    
    # 示例5: 生成质检报告
    print("\n" + "=" * 60)
    print("示例5: 生成质检报告")
    print("=" * 60)
    
    report = analyzer.generate_compliance_report(
        may_results,
        output_file='compliance_report.txt'
    )
    print("质检报告已保存到 compliance_report.txt")
    
    # 示例6: 生成培训文档
    print("\n" + "=" * 60)
    print("示例6: 生成培训文档")
    print("=" * 60)
    
    doc = analyzer.generate_training_document(
        signed_users,
        output_file='training_document.txt'
    )
    print("培训文档已保存到 training_document.txt")
    
    # 示例7: 自定义过滤
    print("\n" + "=" * 60)
    print("示例7: 自定义过滤")
    print("=" * 60)
    
    filtered = analyzer.analyze_directory(
        '/path/to/chats/',
        filter_func=lambda f: '202505' in f and '已報' in f
    )
    print(f"符合条件的文件共 {len(filtered)} 个")


if __name__ == '__main__':
    main()
