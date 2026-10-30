import { NextResponse, type NextRequest } from 'next/server';

const verses = [
  {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13 (NAA)"
  },
  {
    text: "O Senhor é o meu pastor; nada me faltará.",
    reference: "Salmos 23:1 (NAA)"
  },
  {
    text: "Confie no Senhor de todo o seu coração e não se apoie no seu próprio entendimento.",
    reference: "Provérbios 3:5 (NAA)"
  },
  {
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.",
    reference: "João 3:16 (NAA)"
  },
  {
    text: "Entregue o seu caminho ao Senhor, confie nele, e o mais ele fará.",
    reference: "Salmos 37:5 (NAA)"
  },
  {
    text: "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!",
    reference: "Filipenses 4:4 (NAA)"
  },
  {
    text: "Não tema, porque eu estou com você; não fique com medo, porque eu sou o seu Deus. Eu lhe dou forças; sim, eu o ajudo; sim, eu o seguro com a mão direita da minha justiça.",
    reference: "Isaías 41:10 (NAA)"
  },
  {
    text: "Eu é que sei que pensamentos tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para dar-lhes um futuro e uma esperança.",
    reference: "Jeremias 29:11 (NAA)"
  },
  {
    text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.",
    reference: "Mateus 6:33 (NAA)"
  },
  {
    text: "O Senhor é a minha luz e a minha salvação; de quem terei medo? O Senhor é a fortaleza da minha vida; a quem temerei?",
    reference: "Salmos 27:1 (NAA)"
  },
  {
    text: "Mas os que esperam no Senhor renovam as suas forças. Sobem com asas como águias; correm e não se cansam, caminham e não se fatigam.",
    reference: "Isaías 40:31 (NAA)"
  },
  {
    text: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa delas, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará.",
    reference: "Deuteronômio 31:6 (NAA)"
  },
  {
    text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.",
    reference: "1 Pedro 5:7 (NAA)"
  },
  {
    text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti; o Senhor sobre ti levante o seu rosto e te dê a paz.",
    reference: "Números 6:24-26 (NAA)"
  }
];

export async function GET() {
  try {
    // Seleção determinística baseada no dia do ano
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const verseIndex = dayOfYear % verses.length;
    const dailyVerse = verses[verseIndex];

    return NextResponse.json({ 
      success: true,
      verse: dailyVerse 
    });
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao carregar verso.' 
    }, { status: 500 });
  }
}