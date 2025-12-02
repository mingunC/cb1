// app/sitemap.ts



import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {

  return [

    {

      url: 'https://canadabeaver.pro', // 메인 페이지

      lastModified: new Date(),

      changeFrequency: 'daily',

      priority: 1,

    },

    // 다른 페이지가 있다면 여기에 추가

    // {

    //   url: 'https://canadabeaver.pro/about',

    //   lastModified: new Date(),

    //   changeFrequency: 'monthly',

    //   priority: 0.8,

    // },

  ]

}

