<template>
  <nut-row>
    <nut-col style="height: 30px;">
      <br />
    </nut-col>
    <nut-col :span="18" :offset="3">
      <nut-button block type="primary">未处理</nut-button>
    </nut-col>
    <nut-col style="height: 30px;">
      <br />
    </nut-col>
    <nut-col :span="18" :offset="3">
      <nut-button block type="primary">待回访</nut-button>
    </nut-col>
    <nut-col style="height: 30px;">
      <br />
    </nut-col>
    <nut-col :span="18" :offset="3">
      <nut-button block type="primary">已处理</nut-button>
    </nut-col>
  </nut-row>
</template>
<script>
export default {
  name: 'Complain'
}
</script>
