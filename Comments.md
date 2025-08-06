# 项目运行相关注意事项

1. 在运行之前，修改`.env.development.example`中的环境变量为你自己的小程序AppID。

2. 确保你的小程序有同声传译这个微信官方插件，我们依赖它做TTS

3. 我们使用`Taro`框架[^1]和`NutUI`组件库[^2]进行开发，因此在运行之前确保你的电脑满足`Taro`框架的各种环境要求

4. 对于node版本，本项目强烈推荐使用`v22.13.0`

5. 我们使用`yarn`作为包管理工具，如果你没有`yarn`，请先运行`npm install -g yarn`，这样你就可以在命令行执行`yarn`命令了

6. 开发的命令是`yarn run dev:weapp`，此时在你的`KQTongxin`文件夹下会出现一个`dist`文件夹，在微信小程序开发工具里面选择这个`dist`文件夹并导入，就可以在微信小程序中实时预览页面

6. 如果你是第一次`fork`这个项目，先运行`yarn install`安装所有依赖

[^1]: https://docs.taro.zone/docs/

[^2]: https://nutui.jd.com/taro/vue/4x/#/zh-CN/component/avatar
