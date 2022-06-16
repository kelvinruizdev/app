/* eslint-disable no-continue */
import { useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  Box, toast, useColorModeValue, Image,
} from '@chakra-ui/react';
import useTranslation from 'next-translate/useTranslation';
import PropTypes from 'prop-types';
import getT from 'next-translate/getT';
import { languageLabel } from '../../../utils';
import Link from '../../../common/components/NextChakraLink';
import MarkDownParser from '../../../common/components/MarkDownParser';
import getMarkDownContent from '../../../common/components/MarkDownParser/markdown';
import { MDSkeleton } from '../../../common/components/Skeleton';
import Heading from '../../../common/components/Heading';
import Text from '../../../common/components/Text';
import Icon from '../../../common/components/Icon';
import TagCapsule from '../../../common/components/TagCapsule';
import { publicRedirectByAsset } from '../../../lib/redirectsHandler';

export const getStaticPaths = async ({ locales }) => {
  const resp = await fetch(`${process.env.BREATHECODE_HOST}/v1/registry/asset?type=ARTICLE`);
  const data = await resp.json();

  const paths = data.flatMap((res) => locales.map((locale) => ({
    params: {
      slug: res.slug,
    },
    locale,
  })));
  return {
    fallback: false,
    paths,
  };
};
export const getStaticProps = async ({ params, locale, locales }) => {
  const t = await getT(locale, 'how-to');
  const staticImage = t('seo.image', { domain: process.env.WEBSITE_URL || 'https://4geeks.com' });
  const { slug } = params;
  const resp = await fetch(`${process.env.BREATHECODE_HOST}/v1/registry/asset/${slug}?type=ARTICLE`);
  const data = await resp.json();

  const {
    title, description, translations, preview,
  } = data;

  const markdownResp = await fetch(`${process.env.BREATHECODE_HOST}/v1/registry/asset/${slug}.md`);
  const markdown = await markdownResp.text();

  if (resp.status >= 400) {
    return {
      notFound: true,
    };
  }

  const ogUrl = {
    en: `/how-to/${slug}`,
    us: `/how-to/${slug}`,
  };

  return {
    props: {
      seo: {
        title,
        description: description || '',
        image: preview || staticImage,
        type: 'article',
        translations,
        pathConnector: '/how-to',
        url: ogUrl.en || `/${locale}/how-to/${slug}`,
        keywords: data?.seo_keywords || '',
        card: 'default',
        locales,
        locale,
        publishedTime: data?.created_at || '',
        modifiedTime: data?.updated_at || '',
      },

      // page props
      fallback: false,
      data,
      markdown,
    },
  };
};

export default function HowToSlug({ data, markdown }) {
  const { t } = useTranslation('how-to');
  const { title, author, preview } = data;
  const { translations } = data;
  const defaultImage = '/static/images/coding-notebook.png';
  const getImage = preview || defaultImage;
  const router = useRouter();
  const language = router.locale === 'en' ? 'us' : 'es';
  const { slug } = router.query;
  const currentLanguageLabel = languageLabel[language] || language;
  const markdownData = getMarkDownContent(markdown);
  const linkColor = useColorModeValue('blue.default', 'blue.300');

  useEffect(() => {
    axios.get(`${process.env.BREATHECODE_HOST}/v1/registry/asset/${slug}?type=ARTICLE`)
      .then((res) => {
        let currentlocaleLang = res.data.translations[language];
        if (currentlocaleLang === undefined) currentlocaleLang = `${slug}-${language}`;
        axios.get(`${process.env.BREATHECODE_HOST}/v1/registry/asset/${currentlocaleLang}?asset_type=ARTICLE`)
          .catch(() => {
            toast({
              title: t('alert-message:language-not-found', { currentLanguageLabel }),
              status: 'warning',
              duration: 5500,
              isClosable: true,
            });
          });
      });
  }, [language]);

  useEffect(() => {
    const pathWithoutSlug = router.asPath.slice(0, router.asPath.lastIndexOf('/'));
    const userPathName = `/${router.locale}${pathWithoutSlug}/${data.slug || slug}`;
    const pagePath = 'how-to';

    publicRedirectByAsset({
      router, translations, userPathName, pagePath,
    });
  }, [router, router.locale, translations]);

  return (
    <>
      <Box display="flex" justifyContent="space-between" margin={{ base: '2% 4% 0 4%', lg: '2% 10% 0 10%' }}>
        <Link
          href="/how-to"
          color={linkColor}
          display="inline-block"
          letterSpacing="0.05em"
          fontWeight="700"
        >
          {`← ${t('back-to')}`}
        </Link>
      </Box>
      <Box
        gridGap="20px"
        maxWidth="1012px"
        margin={{ base: '3% 4%', md: '3% 10% 4% 10%', lg: '3% 24% 4% 24%' }}
        borderBottom={1}
        borderStyle="solid"
        borderColor={useColorModeValue('gray.200', 'gray.900')}
      >
        <Box display="flex" gridGap="10px" justifyContent="space-between" mb="12px">
          <TagCapsule
            variant="rounded"
            isLink
            href="/how-to"
            tags={data.technologies}
            marginY="8px"
            fontSize="13px"
            style={{
              padding: '2px 10px',
              margin: '0',
            }}
            gap="10px"
            paddingX="0"
          />
          <Link href={data.readme_url} width="fit-content" color="gray.400" target="_blank" rel="noopener noreferrer" display="flex" justifyContent="right" gridGap="12px" alignItems="center">
            <Icon icon="pencil" color="#A0AEC0" width="20px" height="20px" />
            {t('common:edit-on-github')}
          </Link>
        </Box>
        <Heading size="l" fontWeight="700">
          {title}
        </Heading>
        <Box margin="24px 0 0 0">
          <Text size="l" fontWeight="900" textTransform="uppercase">
            {t('written-by')}
          </Text>
          <Text fontSize="l">
            {`${author.first_name} ${author.last_name}`}
          </Text>
        </Box>

        <Image src={getImage} alt={title} margin="20px 0 30px 0" width="100%" borderRadius="10px" height="100%" style={{ aspectRatio: '12/6' }} />
        <Box
          borderRadius="3px"
          margin="0 auto"
          maxWidth="1012px"
          flexGrow={1}
          className={`markdown-body ${useColorModeValue('light', 'dark')}`}
        >
          {markdown ? (
            <MarkDownParser content={markdownData.content} />
          ) : (
            <MDSkeleton />
          )}
        </Box>

      </Box>
    </>
  );
}

HowToSlug.propTypes = {
  data: PropTypes.objectOf(PropTypes.any).isRequired,
  markdown: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};
