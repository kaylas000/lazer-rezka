#!/usr/bin/env ruby
# Скрипт для генерации llms-full.txt из всего контента Jekyll сайта

require 'fileutils'

content_dirs = ['_posts', 'pages']
root_files = ['index.html', 'README.md']

output = []
output << "# ПОЛНЫЙ ТЕКСТОВЫЙ ДАМП САЙТА: Цех лазерной резки"
output << "# Сгенерировано: #{Time.now.strftime('%Y-%m-%d')}"
output << "# Для индексации AI-системами"
output << ""
output << "=" * 80
output << ""

def clean_html(text)
  text = text.gsub(/<script\b[^>]*>.*?<\/script>/im, '')
  text = text.gsub(/<style\b[^>]*>.*?<\/style>/im, '')
  text = text.gsub(/<[^>]+>/, ' ')
  text = text.gsub(/\{%.*?%\}/, '')
  text = text.gsub(/\{\{.*?\}\}/, '')
  text = text.gsub(/\s+/, ' ').strip
  text
end

root_files.each do |file|
  next unless File.exist?(file)
  output << "FILE: /#{file}"
  output << "-" * 80
  content = File.read(file, encoding: 'UTF-8')
  if content =~ /\A---\s*\n(.*?)\n---\s*\n(.*)/m
    output << "METADATA: #{$1}"
    output << ""
    output << clean_html($2)
  else
    output << clean_html(content)
  end
  output << ""
  output << "=" * 80
  output << ""
end

content_dirs.each do |dir|
  next unless Dir.exist?(dir)
  Dir.glob("#{dir}/**/*.{html,md}").sort.each do |file|
    output << "FILE: /#{file}"
    output << "-" * 80
    content = File.read(file, encoding: 'UTF-8')
    if content =~ /\A---\s*\n(.*?)\n---\s*\n(.*)/m
      output << "METADATA: #{$1}"
      output << ""
      output << clean_html($2)
    else
      output << clean_html(content)
    end
    output << ""
    output << "=" * 80
    output << ""
  end
end

File.write('llms-full.txt', output.join("\n"), encoding: 'UTF-8')
puts "✅ llms-full.txt сгенерирован"
