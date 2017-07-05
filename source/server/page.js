import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from '../../webpack.config'

export default app => {
    //use webpack compiler
    const webpackCompiler = webpack(webpackConfig);
    console.log('开始编译前端资源');
    app.use(webpackMiddleware(webpackCompiler, {
        stats: {
            colors: true
        }
    }));
    //use hot reload
    app.use(webpackHotMiddleware(webpackCompiler));
}



