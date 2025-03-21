一 deno版本

https://dash.deno.com/



二 worker版本


1 复制js文件内容到worker


2 sambanova2api请到官方获取accessToken（https://cloud.sambanova.ai）

3 SophNet2api

  需要配置 kv： SOPHNET 并绑定到 worker。

  可选环境变量：AUTH （设置自定义鉴权，不写的话就是 sk-123）和 JSURL（token获取的一个js，这个不用管）

4 akash2api

  AKASH_COOKIES ：https://chat.akash.network 对话获取，多个cookies请用,隔开
  
  OPENAL_APLKEY ：“*” 自选
  
  ALLOWED_ORIGINS ：自行设置

5 cn2api 

 Accesstoken获取：https://pan.wo.cn/

代码来源：L站大佬

https://gist.github.com/J3n5en/69849d814ae5bd0ac40812ef61c5575d


https://gist.github.com/J3n5en/2d542b203cb7f8c4e9be607ef93903a5

https://github.com/Nekohy/Deepinfra2api

