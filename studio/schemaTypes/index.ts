import {blockContent} from './blockContent'
import {link} from './link'

import {
  heroHome,
  heroInner,
  featuredProjects,
  projectsGrid,
  cardGrid,
  cardGridText,
  textImage,
  ourStory,
  testimonialsBlock,
  faqBlock,
  ctaBlock,
  contactFormBlock,
  mapBlock,
} from './blocks'

import {projectCategory} from './projectCategory'
import {project} from './project'
import {testimonial} from './testimonial'
import {siteSettings} from './siteSettings'
import {navigation} from './navigation'
import {page} from './page'
import {richTextBlock} from './richTextBlock'

export const schemaTypes = [
  blockContent,
  link,

  heroHome,
  heroInner,
  featuredProjects,
  projectsGrid,
  cardGrid,
  cardGridText,
  textImage,
  ourStory,
  testimonialsBlock,
  faqBlock,
  ctaBlock,
  contactFormBlock,
  mapBlock,
  richTextBlock,

  page,
  projectCategory,
  project,
  testimonial,
  siteSettings,
  navigation,
]
