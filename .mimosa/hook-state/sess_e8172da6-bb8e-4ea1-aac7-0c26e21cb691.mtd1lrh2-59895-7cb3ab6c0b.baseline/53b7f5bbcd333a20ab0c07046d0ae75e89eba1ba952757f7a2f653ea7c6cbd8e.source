/* =====================================================
 * txmap.js - Tencent Map IP Welcome Script
 * ===================================================== */

/* ========== 可配置项（只需改这里） ========== */
const TXMAP_CONFIG = {
    // 腾讯位置服务 Key
    TX_KEY: 'OANBZ-WGOC7-W4LXH-POSPC-F7HST-OTFQV',

    // 站长坐标（经度, 纬度）
    OWNER_LNG: 119.99,
    OWNER_LAT: 30.30,

    // 站点昵称
    BLOG_NAME: 'Koco-co',

    // DOM 容器 ID
    CONTAINER_ID: 'welcome-info'
};

/* ========== 页面初始：先显示基础欢迎信息 ========== */
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
        showWelcome();
    }
});

/* ========== IP 定位请求（JSONP） ========== */
let ipLoacation;

window.addEventListener('load', function () {
    setTimeout(function () {
        if (typeof $ === 'undefined') return;

        $.ajax({
            type: 'get',
            url: 'https://apis.map.qq.com/ws/location/v1/ip',
            data: {
                key: TXMAP_CONFIG.TX_KEY,
                output: 'jsonp'
            },
            dataType: 'jsonp',
            timeout: 5000,
            success: function (res) {
                ipLoacation = res;
                if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
                    showWelcome();
                }
            },
            error: function () {
                // JSONP 失败时静默处理
            }
        });
    }, 100);
});

/* ========== 计算球面距离（公里） ========== */
function getDistance(e1, n1, e2, n2) {
    const R = 6371;
    const {sin, cos, asin, PI, hypot} = Math;

    let getPoint = (e, n) => {
        e *= PI / 180;
        n *= PI / 180;
        return {
            x: cos(n) * cos(e),
            y: cos(n) * sin(e),
            z: sin(n)
        };
    };

    let a = getPoint(e1, n1);
    let b = getPoint(e2, n2);
    let c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    return Math.round(asin(Math.min(1, c / 2)) * 2 * R);
}

/* ========== 欢迎信息主函数（可重复安全调用） ========== */
function showWelcome() {
    const el = document.getElementById(TXMAP_CONFIG.CONTAINER_ID);
    if (!el) return;

    /* ===== 时间问候 ===== */
    const hour = new Date().getHours();
    let timeChange =
        hour >= 5 && hour < 11 ? '<span>上午好</span>，愿你今天一切顺利~~~' :
            hour < 13 ? '<span>中午好</span>，记得按时吃饭哦~~~' :
                hour < 15 ? '<span>下午好</span>，不妨小憩片刻~~~' :
                    hour < 16 ? '<span>三点多啦</span>，喝点下午茶吧~~~' :
                        hour < 19 ? '<span>傍晚好</span>，愿你收获满满~~~' :
                            hour < 24 ? '<span>晚上好</span>，放松一下吧~~~' :
                                '夜深了，记得早点休息~~~';

    try {
        /* ===== 有 IP 信息（增强展示） ===== */
        if (ipLoacation && ipLoacation.status === 0) {
            const info = ipLoacation.result;
            const ad = info.ad_info || {};
            const loc = info.location || {};

            const dist = getDistance(
                TXMAP_CONFIG.OWNER_LNG,
                TXMAP_CONFIG.OWNER_LAT,
                loc.lng,
                loc.lat
            );

            let pos = ad.nation || '未知地区';
            let ip = info.ip || '未知 IP';
            let posdesc = '感谢你的到来，愿你有所收获。';

            /* ===== 国家 / 地区文案 ===== */
            switch (ad.nation) {
                case '日本':
                    posdesc = 'よろしく，一起去看樱花吗？';
                    break;
                case '美国':
                    posdesc = 'May peace be with you.';
                    break;
                case '英国':
                    posdesc = '想与你夜乘伦敦眼。';
                    break;
                case '俄罗斯':
                    posdesc = '干了这杯伏特加！';
                    break;
                case '法国':
                    posdesc = "C'est la vie.";
                    break;
                case '德国':
                    posdesc = 'Die Zeit verging im Fluge.';
                    break;
                case '澳大利亚':
                    posdesc = '一起去大堡礁看看吧！';
                    break;
                case '加拿大':
                    posdesc = '拾一片枫叶赠予你。';
                    break;

                case '中国':
                    pos = [ad.province, ad.city, ad.district].filter(Boolean).join(' ');
                    posdesc = getChinaDesc(ad);
                    break;

                default:
                    posdesc = '世界很大，感谢你的到来。';
            }

            el.innerHTML = `
                <b>
                    <center>🎉 欢迎信息 🎉</center>
                    欢迎来自
                    <span style="color:var(--theme-color)">${pos}</span>
                    的朋友，${timeChange}
                    <br>
                    你当前距离
                    <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                    约
                    <span style="color:var(--theme-color)">${dist}</span>
                    公里，
                    IP 地址：
                    <span style="color:var(--theme-color)">${ip}</span>
                    <br>
                    ${posdesc}
                </b>
            `;
        }
        /* ===== 无 IP 信息（基础展示） ===== */
        else {
            el.innerHTML = `
                <b>
                    <center>🎉 欢迎信息 🎉</center>
                    欢迎来到
                    <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                    的小窝，${timeChange}
                </b>
            `;
        }
    } catch (e) {
        el.innerHTML = `
            <b>
                <center>🎉 欢迎信息 🎉</center>
                欢迎来到
                <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                的小窝，${timeChange}
            </b>
        `;
    }
}

/* ========== 中国地区文案拆分（便于维护） ========== */
function getChinaDesc(ad) {
    const map = {
        '北京市': '北——京——欢迎你。',
        '天津市': '来段相声助助兴。',
        '河北省': '山河壮丽，天下雄关。',
        '山西省': '表里山河，晋善晋美。',
        '内蒙古自治区': '天苍苍，野茫茫。',
        '辽宁省': '安排一顿地道烧烤吧。',
        '吉林省': '白山黑水，热情豪爽。',
        '黑龙江省': '冰城的冬天很浪漫。',
        '上海市': '欢迎来到魔都。',
        '浙江省': '诗画江南，山水如梦。',
        '江苏省': '上有天堂，下有苏杭。',
        '安徽省': '蚌埠住了，芜湖起飞。',
        '福建省': '山海相逢，风景正好。',
        '江西省': '落霞与孤鹜齐飞。',
        '山东省': '齐鲁大地，礼仪之邦。',
        '湖北省': '来碗热干面吧。',
        '湖南省': '辣得过瘾，吃得开心。',
        '广东省': '饮茶先啦。',
        '广西壮族自治区': '桂林山水甲天下。',
        '海南省': '面朝大海，春暖花开。',
        '四川省': '巴适得板。',
        '贵州省': '山水秘境，醇香四溢。',
        '云南省': '彩云之南，风景如画。',
        '陕西省': '来碗臊子面。',
        '甘肃省': '大漠孤烟直。',
        '青海省': '天地辽阔，心亦澄明。',
        '宁夏回族自治区': '塞上江南。',
        '新疆维吾尔自治区': '丝路古道，热情豪迈。',
        '台湾省': '海峡两岸，血脉相连。',
        '香港特别行政区': '东方之珠。',
        '澳门特别行政区': '风情万种的小城。'
    };

    return map[ad.province] || '欢迎来自这片热土的朋友。';
}

/* ========== PJAX 支持 ========== */
document.addEventListener('pjax:complete', function () {
    setTimeout(function () {
        if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
            showWelcome();
        }
    }, 100);
});
